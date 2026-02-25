/**
 * KIE.ai Suno API client.
 * Docs: https://docs.kie.ai/suno-api/generate-music
 *
 * VERIFIED WORKING: Feb 18, 2026
 * Status progression: PENDING → TEXT_SUCCESS → FIRST_SUCCESS → SUCCESS (~65s)
 * Returns 2 tracks per generation (pick the best one).
 */

const KIE_API_URL = 'https://api.kie.ai';
const POLL_INTERVAL_MS = 10_000; // 10 seconds
const MAX_POLL_ATTEMPTS = 30;    // ~5 minutes max

interface KieGenerateRequest {
  customMode: boolean;     // true = provide lyrics + style
  instrumental: boolean;
  model: string;           // V3_5 | V4 | V4_5 | V5
  title: string;
  style: string;           // genre/mood tags
  prompt: string;          // lyrics (custom) or description (non-custom)
  callBackUrl: string;     // REQUIRED
}

interface KieSunoTrack {
  id: string;
  title: string;
  audioUrl: string;       // camelCase in actual response
  imageUrl: string;       // camelCase in actual response
  duration: number;
}

interface KiePollResponse {
  code: number;
  data: {
    taskId: string;
    status: string;        // PENDING | TEXT_SUCCESS | FIRST_SUCCESS | SUCCESS | GENERATE_AUDIO_FAILED
    response?: {
      sunoData?: KieSunoTrack[];
    };
  };
}

export interface KieTrackResult {
  id: string;
  audio_url: string;
  image_url: string;
  duration: number;
}

function getApiKey(): string {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error('KIE_API_KEY is not set');
  return key;
}

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
}

function getCallbackUrl(): string {
  return process.env.KIE_CALLBACK_URL || 'https://webhook.site/placeholder';
}

/**
 * Build a webhook callback URL with project/track context.
 * KIE will POST to this URL on completion.
 */
function buildWebhookUrl(projectId: string, trackNumber: number): string {
  const base = getAppBaseUrl();
  if (!base) return getCallbackUrl(); // fallback to legacy
  const secret = process.env.KIE_WEBHOOK_SECRET || '';
  return `${base}/api/kie-webhook?projectId=${projectId}&trackNumber=${trackNumber}&secret=${secret}`;
}

/**
 * Submit a custom generation request to KIE.
 * Uses customMode=true with lyrics + style tags.
 */
export async function submitKieGeneration(
  lyrics: string,
  stylePrompt: string,
  title: string,
  instrumental: boolean = false,
  model: string = 'V5'
): Promise<string> {
  const body: KieGenerateRequest = {
    customMode: true,
    instrumental,
    model,
    title,
    style: stylePrompt,
    prompt: lyrics,
    callBackUrl: getCallbackUrl(),
  };

  console.log(`[kie] Submitting generation: "${title}" | model=${model} | instrumental=${instrumental}`);
  console.log(`[kie] Style: ${stylePrompt}`);

  const response = await fetch(`${KIE_API_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[kie] Generate error ${response.status}:`, errorText);
    throw new Error(`KIE generate error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (data.code !== 200 || !data.data?.taskId) {
    console.error(`[kie] Submission failed:`, data);
    throw new Error(`KIE submission failed: ${JSON.stringify(data)}`);
  }

  console.log(`[kie] Task submitted: ${data.data.taskId}`);
  return data.data.taskId;
}

/**
 * Poll KIE for track completion.
 * Returns the longer of the two generated tracks (KIE generates 2 per request).
 */
export async function pollKieCompletion(taskId: string): Promise<KieTrackResult> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const response = await fetch(
        `${KIE_API_URL}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`KIE poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const result: KiePollResponse = await response.json();
      const status = result.data?.status;

      console.log(`KIE poll [${attempt + 1}/${MAX_POLL_ATTEMPTS}]: ${status}`);

      if (status === 'SUCCESS') {
        const tracks = result.data.response?.sunoData;
        if (!tracks?.length) {
          throw new Error('KIE returned SUCCESS but no track data');
        }

        // Pick the longer track (better quality usually)
        const best = tracks.reduce((a, b) => (b.duration > a.duration ? b : a));

        return {
          id: best.id,
          audio_url: best.audioUrl,
          image_url: best.imageUrl,
          duration: best.duration,
        };
      }

      if (status === 'GENERATE_AUDIO_FAILED' || status?.includes('FAILED')) {
        throw new Error(`KIE generation failed: ${status}`);
      }

      // PENDING, TEXT_SUCCESS, FIRST_SUCCESS — keep polling
    } catch (error) {
      if (attempt === MAX_POLL_ATTEMPTS - 1) throw error;
      // Only log non-terminal errors
      if (error instanceof Error && !error.message.includes('FAILED')) {
        console.warn(`KIE poll error (attempt ${attempt + 1}):`, error.message);
      } else {
        throw error;
      }
    }
  }

  throw new Error('KIE generation timed out');
}

/**
 * Check KIE credit balance.
 */
export async function checkKieCredits(): Promise<number> {
  const response = await fetch(`${KIE_API_URL}/api/v1/chat/credit`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!response.ok) throw new Error(`KIE credits check failed: ${response.status}`);

  const data = await response.json();
  return data?.data ?? 0;
}

/**
 * Generate a single track end-to-end via KIE (polling mode — legacy).
 * Use submitKieWithWebhook() for webhook mode instead.
 */
export async function generateTrackViaKie(
  lyrics: string,
  stylePrompt: string,
  title: string,
  instrumental: boolean = false
): Promise<KieTrackResult> {
  const taskId = await submitKieGeneration(lyrics, stylePrompt, title, instrumental);
  return pollKieCompletion(taskId);
}

/**
 * Submit a KIE generation with project-aware webhook callback.
 * Returns the taskId immediately — no polling. KIE calls our webhook on completion.
 */
export async function submitKieWithWebhook(
  lyrics: string,
  stylePrompt: string,
  title: string,
  projectId: string,
  trackNumber: number,
  instrumental: boolean = false,
  model: string = 'V5'
): Promise<string> {
  const webhookUrl = buildWebhookUrl(projectId, trackNumber);

  const body: KieGenerateRequest = {
    customMode: true,
    instrumental,
    model,
    title,
    style: stylePrompt,
    prompt: lyrics,
    callBackUrl: webhookUrl,
  };

  console.log(`[kie] Submitting with webhook: "${title}" | project=${projectId} track=${trackNumber}`);
  console.log(`[kie] Webhook URL: ${webhookUrl.replace(/secret=[^&]*/, 'secret=***')}`);
  console.log(`[kie] Style: ${stylePrompt}`);

  const response = await fetch(`${KIE_API_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[kie] Generate error ${response.status}:`, errorText);
    throw new Error(`KIE generate error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  if (data.code !== 200 || !data.data?.taskId) {
    console.error(`[kie] Submission failed:`, data);
    throw new Error(`KIE submission failed: ${JSON.stringify(data)}`);
  }

  console.log(`[kie] Task submitted (webhook mode): ${data.data.taskId}`);
  return data.data.taskId;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
