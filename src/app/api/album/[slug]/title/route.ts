import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { index, projectId } = await request.json();

    if (typeof index !== 'number' || !projectId) {
      return NextResponse.json({ error: 'Missing index or projectId' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Fetch album and verify ownership
    const { data: album } = await db
      .from('albums')
      .select('id, project_id, title_alternatives')
      .eq('share_slug', slug)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (album.project_id !== projectId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const alternatives = album.title_alternatives as { title: string; tagline: string }[] | null;
    if (!alternatives || index < 0 || index >= alternatives.length) {
      return NextResponse.json({ error: 'Invalid title index' }, { status: 400 });
    }

    const chosen = alternatives[index];

    await db.from('albums').update({
      title: chosen.title,
      tagline: chosen.tagline,
    }).eq('id', album.id);

    return NextResponse.json({ title: chosen.title, tagline: chosen.tagline });
  } catch (err) {
    console.error('[api/album/title] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
