import { getServiceSupabase } from './supabase';

interface LogGenerationParams {
  projectId: string;
  trackNumber?: number;
  event: string;
  stylePrompt?: string;
  durationMs?: number;
  model?: string;
  errorMessage?: string;
}

export async function logGeneration(params: LogGenerationParams): Promise<void> {
  try {
    const db = getServiceSupabase();
    await db.from('generation_logs').insert({
      project_id: params.projectId,
      track_number: params.trackNumber ?? null,
      event: params.event,
      style_prompt: params.stylePrompt ?? null,
      duration_ms: params.durationMs ?? null,
      model: params.model ?? null,
      error_message: params.errorMessage ?? null,
    });
  } catch (err) {
    // Non-critical — don't block generation on logging failures
    console.error('[log-generation] Failed to log:', err);
  }
}
