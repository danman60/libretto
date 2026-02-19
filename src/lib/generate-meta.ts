/**
 * V2: Generate album metadata (LifeMap, biography, title) from 3 moments.
 * Called after moment 3 is submitted.
 */

import { getServiceSupabase } from './supabase';
import { callDeepSeek, callDeepSeekJSON } from './deepseek';
import { buildLifeMapPrompt, buildBiographyPrompt, buildAlbumTitlePrompt } from './prompts';
import { logGeneration } from './log-generation';
import type { LifeMap, MomentContent } from './types';

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export async function generateAlbumMeta(projectId: string): Promise<void> {
  const db = getServiceSupabase();
  console.log(`[generate-meta] Starting for project ${projectId}`);

  try {
    // Update status
    await db.from('projects').update({
      status: 'generating_meta',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);

    // Fetch the 3 moments
    const { data: moments } = await db
      .from('story_intake')
      .select('step, content')
      .eq('project_id', projectId)
      .in('step', ['moment_1', 'moment_2', 'moment_3'])
      .order('step');

    if (!moments || moments.length < 3) {
      console.error('[generate-meta] Missing moment data, only found:', moments?.length);
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    const m1 = moments.find((m: { step: string }) => m.step === 'moment_1')?.content as MomentContent;
    const m2 = moments.find((m: { step: string }) => m.step === 'moment_2')?.content as MomentContent;
    const m3 = moments.find((m: { step: string }) => m.step === 'moment_3')?.content as MomentContent;

    if (!m1?.story || !m2?.story || !m3?.story) {
      console.error('[generate-meta] Moments missing story content');
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    // Generate LifeMap
    console.log('[generate-meta] Generating LifeMap...');
    const lifeMapStart = Date.now();
    await logGeneration({ projectId, event: 'lifemap_started', model: 'deepseek-chat' });

    let lifeMap: LifeMap;
    try {
      lifeMap = await callDeepSeekJSON<LifeMap>(
        buildLifeMapPrompt(m1.story, m2.story, m3.story)
      );
      await logGeneration({
        projectId, event: 'lifemap_done',
        durationMs: Date.now() - lifeMapStart, model: 'deepseek-chat',
      });
      console.log('[generate-meta] LifeMap done:', lifeMap.themes?.length, 'themes');
    } catch (err) {
      console.error('[generate-meta] LifeMap failed:', err);
      await logGeneration({
        projectId, event: 'lifemap_failed', model: 'deepseek-chat',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
      return;
    }

    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'lifemap',
      content: lifeMap,
      llm_model: 'deepseek-chat',
    });

    // Generate biography
    console.log('[generate-meta] Generating biography...');
    const bioStart = Date.now();
    await logGeneration({ projectId, event: 'biography_started', model: 'deepseek-chat' });

    let biography: string;
    try {
      biography = await callDeepSeek(
        buildBiographyPrompt(lifeMap, m1.story, m2.story, m3.story),
        { temperature: 0.7, maxTokens: 2000 }
      );
      await logGeneration({
        projectId, event: 'biography_done',
        durationMs: Date.now() - bioStart, model: 'deepseek-chat',
      });
      console.log('[generate-meta] Biography done:', biography.length, 'chars');
    } catch (err) {
      console.error('[generate-meta] Biography failed:', err);
      await logGeneration({
        projectId, event: 'biography_failed', model: 'deepseek-chat',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      biography = 'Their story speaks through the music.';
    }

    await db.from('generated_content').insert({
      project_id: projectId,
      content_type: 'biography',
      content: { markdown: biography },
      llm_model: 'deepseek-chat',
    });

    // Generate album title (now returns 3 options)
    console.log('[generate-meta] Generating album title...');
    const titleStart = Date.now();
    await logGeneration({ projectId, event: 'title_started', model: 'deepseek-chat' });

    let albumTitle = 'Untitled';
    let albumTagline = '';
    let titleAlternatives: { title: string; tagline: string }[] | null = null;

    try {
      const titleResult = await callDeepSeekJSON<{
        titles: { title: string; tagline: string }[];
        recommended: number;
      }>(buildAlbumTitlePrompt(lifeMap));

      titleAlternatives = titleResult.titles;
      const recommended = titleResult.recommended ?? 0;
      albumTitle = titleResult.titles[recommended]?.title ?? titleResult.titles[0]?.title ?? 'Untitled';
      albumTagline = titleResult.titles[recommended]?.tagline ?? titleResult.titles[0]?.tagline ?? '';

      await logGeneration({
        projectId, event: 'title_done',
        durationMs: Date.now() - titleStart, model: 'deepseek-chat',
      });
      console.log('[generate-meta] Title:', albumTitle, '| Tagline:', albumTagline, '| Alternatives:', titleAlternatives?.length);
    } catch (err) {
      console.error('[generate-meta] Title failed:', err);
      await logGeneration({
        projectId, event: 'title_failed', model: 'deepseek-chat',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      albumTitle = lifeMap.themes?.[0] || 'My Story';
    }

    // Create album
    const shareSlug = generateSlug();

    // Use cover from first completed track if available
    const { data: firstTrack } = await db
      .from('tracks')
      .select('cover_image_url')
      .eq('project_id', projectId)
      .eq('status', 'complete')
      .order('track_number')
      .limit(1)
      .single();

    await db.from('albums').insert({
      project_id: projectId,
      title: albumTitle,
      tagline: albumTagline,
      biography_markdown: biography,
      share_slug: shareSlug,
      cover_image_url: firstTrack?.cover_image_url || null,
      title_alternatives: titleAlternatives,
    });

    console.log('[generate-meta] Album created with slug:', shareSlug);

    // Check if all 3 tracks are complete
    const { data: allTracks } = await db
      .from('tracks')
      .select('status')
      .eq('project_id', projectId);

    const allComplete = allTracks?.length === 3 && allTracks.every((t: { status: string }) => t.status === 'complete');

    if (allComplete) {
      await db.from('projects').update({
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('id', projectId);
      console.log('[generate-meta] All tracks complete, project finalized');
    } else {
      // Keep generating_meta status — tracks still in progress
      // The status poller will check periodically
      console.log('[generate-meta] Meta done, waiting for tracks to complete');
    }
  } catch (err) {
    console.error('[generate-meta] Fatal error:', err);
    await logGeneration({
      projectId, event: 'meta_fatal_error',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await db.from('projects').update({ status: 'failed' }).eq('id', projectId);
  }
}
