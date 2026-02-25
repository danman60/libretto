import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { maybeFinalizeProject } from '@/lib/generate-show';
import { logGeneration } from '@/lib/log-generation';

/**
 * POST /api/kie-webhook
 * Receives callbacks from KIE.ai when audio generation completes.
 *
 * Query params: projectId, trackNumber, secret
 * KIE sends: { code, msg, data: { callbackType, task_id, data: [...tracks] } }
 *
 * Callback types: "text" | "first" | "complete" | "error"
 * Must respond within 15s. KIE retries 3x on failure.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const trackNumberStr = searchParams.get('trackNumber');
  const secret = searchParams.get('secret');

  // Validate query params
  if (!projectId || !trackNumberStr) {
    console.error('[kie-webhook] Missing projectId or trackNumber');
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const trackNumber = parseInt(trackNumberStr, 10);
  if (isNaN(trackNumber) || trackNumber < 1 || trackNumber > 6) {
    console.error('[kie-webhook] Invalid trackNumber:', trackNumberStr);
    return NextResponse.json({ error: 'Invalid trackNumber' }, { status: 400 });
  }

  // Simple shared-secret validation
  const expectedSecret = process.env.KIE_WEBHOOK_SECRET || '';
  if (expectedSecret && secret !== expectedSecret) {
    console.error('[kie-webhook] Invalid secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: KieWebhookPayload;
  try {
    body = await request.json();
  } catch {
    console.error('[kie-webhook] Failed to parse body');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const callbackType = body.data?.callbackType;
  const taskId = body.data?.task_id;

  console.log(`[kie-webhook] ${callbackType} | project=${projectId} track=${trackNumber} task=${taskId}`);

  const db = getServiceSupabase();

  // Handle different callback types
  switch (callbackType) {
    case 'text':
      // Lyrics/text phase complete — just log, no DB update needed
      console.log(`[kie-webhook] Text phase complete for track ${trackNumber}`);
      break;

    case 'first':
      // First track variant ready — could use for preview but we wait for complete
      console.log(`[kie-webhook] First variant ready for track ${trackNumber}`);
      break;

    case 'complete': {
      // All variants ready — Suno puts the preferred one first
      const tracks = body.data?.data;
      if (!tracks?.length) {
        console.error('[kie-webhook] Complete callback but no track data');
        return NextResponse.json({ error: 'No track data' }, { status: 400 });
      }

      // First in array = Suno's top pick (matches web UI ordering)
      const primary = tracks[0];
      const alt = tracks.length > 1 ? tracks[1] : null;

      console.log(`[kie-webhook] Completing track ${trackNumber}: primary=${primary.audio_url?.substring(0, 60)}... duration=${primary.duration}s | variants=${tracks.length}`);

      await logGeneration({
        projectId,
        trackNumber,
        event: 'audio_done',
        model: primary.model_name || 'kie-suno',
      });

      // Update track with primary variant + generation stats
      const updateData: Record<string, unknown> = {
        suno_task_id: taskId || primary.id,
        suno_id: primary.id,
        audio_url: primary.audio_url,
        cover_image_url: primary.image_url,
        duration: primary.duration,
        suno_model: primary.model_name || null,
        suno_tags: primary.tags || null,
        suno_created_at: primary.createTime || null,
        status: 'complete',
        updated_at: new Date().toISOString(),
      };

      // Store alternate variant for A/B switching
      if (alt) {
        updateData.alt_audio_url = alt.audio_url;
        updateData.alt_cover_image_url = alt.image_url;
        updateData.alt_duration = alt.duration;
        updateData.alt_suno_id = alt.id;
      }

      await db.from('tracks').update(updateData)
        .eq('project_id', projectId).eq('track_number', trackNumber);

      // Backfill album cover art if missing
      if (primary.image_url) {
        await db.from('albums')
          .update({ cover_image_url: primary.image_url })
          .eq('project_id', projectId)
          .is('cover_image_url', null);
      }

      // Check if all tracks are done
      await maybeFinalizeProject(projectId);

      console.log(`[kie-webhook] Track ${trackNumber} complete | model=${primary.model_name} tags=${primary.tags?.substring(0, 50)}`);
      break;
    }

    case 'error': {
      console.error(`[kie-webhook] Generation failed for track ${trackNumber}: ${body.msg}`);

      await logGeneration({
        projectId,
        trackNumber,
        event: 'failed',
        errorMessage: body.msg || 'KIE generation failed',
        model: 'kie-suno',
      });

      await db.from('tracks').update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      }).eq('project_id', projectId).eq('track_number', trackNumber);

      break;
    }

    default:
      console.warn(`[kie-webhook] Unknown callbackType: ${callbackType}`);
  }

  // Always return 200 quickly — KIE retries on non-200
  return NextResponse.json({ received: true });
}

// ===== Types for the KIE callback payload =====

interface KieWebhookTrack {
  id: string;
  audio_url: string;
  stream_audio_url?: string;
  image_url: string;
  prompt?: string;
  model_name?: string;
  title?: string;
  tags?: string;
  createTime?: string;
  duration: number;
}

interface KieWebhookPayload {
  code: number;
  msg: string;
  data: {
    callbackType: 'text' | 'first' | 'complete' | 'error';
    task_id: string;
    data: KieWebhookTrack[] | null;
  };
}
