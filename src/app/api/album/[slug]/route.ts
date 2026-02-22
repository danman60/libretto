import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import type { MomentContent, Emotion } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    console.log('[api/album] GET for slug:', slug);
    const db = getServiceSupabase();

    const { data: album, error: albumError } = await db
      .from('albums')
      .select('*')
      .eq('share_slug', slug)
      .single();

    if (albumError) {
      console.error('[api/album] Album fetch error:', albumError);
    }

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', album.project_id)
      .order('track_number');

    // Fetch project for type + gift fields
    const { data: project } = await db
      .from('projects')
      .select('is_gift, recipient_name, gift_message, musical_type')
      .eq('id', album.project_id)
      .single();

    // Legacy: fetch dominant emotion for old albums
    let dominantEmotion: Emotion | null = null;
    if (!project?.musical_type) {
      const { data: moment3 } = await db
        .from('story_intake')
        .select('content')
        .eq('project_id', album.project_id)
        .eq('step', 'moment_3')
        .single();

      if (moment3?.content) {
        const content = moment3.content as MomentContent;
        dominantEmotion = content.emotion || null;
      }
    }

    console.log('[api/album] Found album:', album.title, 'with', tracks?.length || 0, 'tracks');

    return NextResponse.json({
      album,
      tracks: tracks || [],
      musicalType: project?.musical_type || null,
      isGift: project?.is_gift || false,
      recipientName: project?.recipient_name || null,
      giftMessage: project?.gift_message || null,
      dominantEmotion,
    });
  } catch (err) {
    console.error('[api/album] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
