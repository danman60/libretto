import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

/*
  Supabase table migration (run once in SQL editor):

  CREATE TABLE libretto.album_feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    album_id uuid NOT NULL REFERENCES libretto.albums(id) ON DELETE CASCADE,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
  );

  CREATE INDEX idx_album_feedback_album_id ON libretto.album_feedback(album_id);
*/

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { rating, comment } = await request.json();

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      return NextResponse.json({ error: 'Comment must be under 500 characters' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const { data: album } = await db
      .from('albums')
      .select('id')
      .eq('share_slug', slug)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Rate limit: max 3 feedback per album in last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db
      .from('album_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('album_id', album.id)
      .gte('created_at', tenMinAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Feedback already received, thank you!' }, { status: 429 });
    }

    const { error } = await db
      .from('album_feedback')
      .insert({
        album_id: album.id,
        rating,
        comment: comment || null,
      });

    if (error) {
      console.error('[api/album/feedback] Insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/album/feedback] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
