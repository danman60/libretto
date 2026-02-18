import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getServiceSupabase();

    const { data: album } = await db
      .from('albums')
      .select('*')
      .eq('share_slug', slug)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { data: tracks } = await db
      .from('tracks')
      .select('*')
      .eq('project_id', album.project_id)
      .eq('status', 'complete')
      .order('track_number');

    return NextResponse.json({
      album,
      tracks: tracks || [],
    });
  } catch (err) {
    console.error('Album error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
