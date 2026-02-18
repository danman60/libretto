/**
 * suno-api proxy client.
 * Communicates with self-hosted gcui-art/suno-api instance.
 */

const POLL_INTERVAL_MS = 15_000; // 15 seconds
const MAX_POLL_ATTEMPTS = 40; // ~10 minutes max
const DELAY_BETWEEN_TRACKS_MS = 10_000; // 10 seconds between submissions

interface SunoGenerateRequest {
  prompt: string; // lyrics
  tags: string; // style description
  title: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
}

interface SunoTrackResult {
  id: string;
  title: string;
  status: string; // 'submitted' | 'queued' | 'streaming' | 'complete' | 'error'
  audio_url: string | null;
  image_url: string | null;
  duration: number | null;
  error_message?: string;
}

function getSunoApiUrl(): string {
  const url = process.env.SUNO_API_URL;
  if (!url) throw new Error('SUNO_API_URL is not set');
  return url.replace(/\/$/, '');
}

/**
 * Submit a custom generation request to suno-api.
 * Returns the task IDs for polling.
 */
export async function submitGeneration(
  lyrics: string,
  stylePrompt: string,
  title: string,
  instrumental: boolean = false
): Promise<string[]> {
  const url = `${getSunoApiUrl()}/api/custom_generate`;

  const body: SunoGenerateRequest = {
    prompt: instrumental ? '' : lyrics,
    tags: stylePrompt,
    title,
    make_instrumental: instrumental,
    wait_audio: false,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`suno-api generate error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // suno-api returns an array of generated items (usually 2 per request)
  if (Array.isArray(data)) {
    return data.map((item: { id: string }) => item.id);
  }

  // Some versions return { data: [...] }
  if (data.data && Array.isArray(data.data)) {
    return data.data.map((item: { id: string }) => item.id);
  }

  throw new Error('Unexpected suno-api response format');
}

/**
 * Poll for track completion.
 * Returns the first completed track result.
 */
export async function pollForCompletion(taskIds: string[]): Promise<SunoTrackResult> {
  const idsParam = taskIds.join(',');

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    try {
      const url = `${getSunoApiUrl()}/api/get?ids=${idsParam}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const results: SunoTrackResult[] = await response.json();

      // Check for completed tracks
      const completed = results.find(
        (r) => r.status === 'complete' && r.audio_url
      );
      if (completed) return completed;

      // Check for errors
      const errored = results.find((r) => r.status === 'error');
      if (errored) {
        throw new Error(`Suno generation failed: ${errored.error_message || 'Unknown error'}`);
      }

      // Still processing — continue polling
    } catch (error) {
      if (attempt === MAX_POLL_ATTEMPTS - 1) throw error;
      console.warn(`Poll error (attempt ${attempt + 1}):`, error);
    }
  }

  throw new Error('Suno generation timed out after max poll attempts');
}

/**
 * Generate a single track end-to-end.
 */
export async function generateTrack(
  lyrics: string,
  stylePrompt: string,
  title: string,
  instrumental: boolean = false
): Promise<SunoTrackResult> {
  const taskIds = await submitGeneration(lyrics, stylePrompt, title, instrumental);
  return pollForCompletion(taskIds);
}

/**
 * Check remaining Suno credits.
 */
export async function checkCredits(): Promise<{ credits_left: number; period: string }> {
  const url = `${getSunoApiUrl()}/api/get_limit`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to check credits: ${response.status}`);
  }

  return response.json();
}

export function getDelayBetweenTracks(): number {
  return DELAY_BETWEEN_TRACKS_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
