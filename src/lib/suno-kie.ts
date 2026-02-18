/**
 * KIE.ai Suno API client.
 * Docs: https://docs.kie.ai/suno-api/generate-music
 *
 * STATUS: API is currently broken (Feb 2026). All generation attempts return
 * GENERATE_AUDIO_FAILED / errorCode 500. Keep this client ready for when
 * they fix it — their dashboard generation works, just not the API.
 */

const KIE_API_URL = 'https://api.kie.ai';
const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_ATTEMPTS = 40;

interface KieGenerateRequest {
  prompt: string;          // lyrics (custom mode) or description (non-custom)
  model: string;           // V3_5 | V4 | V4_5 | V4_5PLUS | V4_5ALL | V5
  custom: boolean;         // true = provide lyrics, false = prompt-based
  instrumental: boolean;
  callBackUrl: string;     // REQUIRED by KIE
  title?: string;          // only in custom mode
  tags?: string;           // style tags, only in custom mode
}

interface KiePollResponse {
  data: {
    taskId: string;
    status: string;        // SUCCESS | GENERATE_AUDIO_FAILED | PENDING | etc
    response?: {
      sunoData?: {
        id: string;
        audio_url: string;
        image_url: string;
        duration: number;
      }[];
    };
  };
}

interface KieTrackResult {
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

function getCallbackUrl(): string {
  // KIE requires a callback URL even though we poll.
  // Use the app URL or a placeholder.
  return process.env.KIE_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/kie`;
}

/**
 * Submit a custom generation request to KIE.
 */
export async function submitKieGeneration(
  lyrics: string,
  stylePrompt: string,
  title: string,
  instrumental: boolean = false,
  model: string = 'V4'
): Promise<string> {
  const body: KieGenerateRequest = {
    prompt: lyrics,
    model,
    custom: true,
    instrumental,
    callBackUrl: getCallbackUrl(),
    title,
    tags: stylePrompt,
  };

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
    throw new Error(`KIE generate error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const taskId = data?.data?.taskId;

  if (!taskId) {
    throw new Error('KIE did not return a taskId');
  }

  return taskId;
}

/**
 * Poll KIE for track completion.
 */
export async function pollKieCompletion(taskId: string): Promise<KieTrackResult> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const response = await fetch(
        `${KIE_API_URL}/api/v1/generate/record-info?taskId=${taskId}`,
        {
          headers: { Authorization: `Bearer ${getApiKey()}` },
        }
      );

      if (!response.ok) {
        console.warn(`KIE poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const result: KiePollResponse = await response.json();
      const status = result.data?.status;

      if (status === 'SUCCESS') {
        const tracks = result.data.response?.sunoData;
        if (tracks?.length) {
          return {
            id: tracks[0].id,
            audio_url: tracks[0].audio_url,
            image_url: tracks[0].image_url,
            duration: tracks[0].duration,
          };
        }
        throw new Error('KIE returned SUCCESS but no track data');
      }

      if (status === 'GENERATE_AUDIO_FAILED') {
        throw new Error('KIE generation failed (GENERATE_AUDIO_FAILED)');
      }

      // Still processing — continue polling
    } catch (error) {
      if (attempt === MAX_POLL_ATTEMPTS - 1) throw error;
      console.warn(`KIE poll error (attempt ${attempt + 1}):`, error);
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
  return data?.data?.credit ?? 0;
}

/**
 * Generate a single track end-to-end via KIE.
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
