import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { generatePlaybillAndAlbum } from '@/lib/generate-show';
import type { MusicalType, ShowConcept } from '@/lib/types';

export const maxDuration = 120;

/**
 * POST /api/finalize-show
 * Called after the user picks a title + poster from the choice gate.
 * 1. Guard: project must be in 'choosing' status
 * 2. Set recommended_title in concept, save backstory
 * 3. Set status to generating_music
 * 4. Generate playbill + album (with chosen title)
 * 5. Overwrite album cover with chosen poster URL
 * 6. Return { success, share_slug }
 */
export async function POST(request: NextRequest) {
  console.log('[api/finalize-show] POST');
  try {
    const body = await request.json();
    const { projectId, titleIndex, posterIndex, customTitle } = body as {
      projectId: string;
      titleIndex: number;
      posterIndex: number;
      customTitle?: string;
    };

    if (!projectId || (titleIndex === undefined && !customTitle)) {
      return NextResponse.json({ error: 'Missing projectId or titleIndex/customTitle' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const { data: project } = await db
      .from('projects')
      .select('id, status, backstory, musical_type, poster_options')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.backstory || !project.musical_type) {
      return NextResponse.json({ error: 'Project missing backstory or musical_type' }, { status: 400 });
    }

    // Build updated concept
    const concept: ShowConcept = JSON.parse(project.backstory);
    const musicalType = project.musical_type as MusicalType;

    if (customTitle) {
      // Custom title: inject as first option and select it
      concept.title_options[0] = { title: customTitle, tagline: '' };
      concept.recommended_title = 0;
    } else {
      concept.recommended_title = titleIndex;
    }

    // Atomic compare-and-swap: only flip if still 'choosing' (prevents double-submit)
    // Use .select('id') to get back rows — count requires { count: 'exact' }
    const { data: updated } = await db.from('projects').update({
      backstory: JSON.stringify(concept),
      status: 'generating_music',
      updated_at: new Date().toISOString(),
    }).eq('id', projectId).eq('status', 'choosing').select('id');

    if (!updated?.length) {
      return NextResponse.json({ error: 'Already finalized' }, { status: 409 });
    }

    const chosenTitle = customTitle || concept.title_options[titleIndex]?.title;
    console.log(`[api/finalize-show] Title chosen: ${chosenTitle}, poster index: ${posterIndex}`);

    // Generate playbill + album (uses the updated recommended_title)
    const shareSlug = await generatePlaybillAndAlbum(projectId, concept, musicalType);

    // Overwrite album cover with chosen poster
    const posterOptions = project.poster_options as { url: string; label: string }[] | null;
    const chosenPosterUrl = posterOptions?.[posterIndex ?? 0]?.url;

    if (chosenPosterUrl) {
      await db.from('albums')
        .update({ cover_image_url: chosenPosterUrl })
        .eq('project_id', projectId);
      console.log('[api/finalize-show] Album cover set to chosen poster');
    }

    return NextResponse.json({ success: true, share_slug: shareSlug });
  } catch (err) {
    console.error('[api/finalize-show] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
