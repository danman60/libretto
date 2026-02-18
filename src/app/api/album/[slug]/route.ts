import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

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
      console.log('[api/album] Album not found for slug:', slug);
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Return all tracks (including in-progress) for partial state handling
    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', album.project_id)
      .order('track_number');

    console.log('[api/album] Found album:', album.title, 'with', tracks?.length || 0, 'tracks');

    return NextResponse.json({
      album,
      tracks: tracks || [],
    });
  } catch (err) {
    console.error('[api/album] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
