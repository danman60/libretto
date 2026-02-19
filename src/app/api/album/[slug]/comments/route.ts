import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getServiceSupabase();

    // Get album id from slug
    const { data: album } = await db
      .from('albums')
      .select('id')
      .eq('share_slug', slug)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { data: comments } = await db
      .from('album_comments')
      .select('id, author_name, message, created_at')
      .eq('album_id', album.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ comments: comments || [] });
  } catch (err) {
    console.error('[api/album/comments] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { authorName, message } = await request.json();

    // Validate
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 1 || authorName.trim().length > 50) {
      return NextResponse.json({ error: 'Name must be 1-50 characters' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 1 || message.trim().length > 500) {
      return NextResponse.json({ error: 'Message must be 1-500 characters' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Get album id from slug
    const { data: album } = await db
      .from('albums')
      .select('id')
      .eq('share_slug', slug)
      .single();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // Basic rate limit: max 5 comments per album in last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db
      .from('album_comments')
      .select('id', { count: 'exact', head: true })
      .eq('album_id', album.id)
      .gte('created_at', tenMinAgo);

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'Too many comments, please wait a few minutes' }, { status: 429 });
    }

    const { data: comment, error } = await db
      .from('album_comments')
      .insert({
        album_id: album.id,
        author_name: authorName.trim(),
        message: message.trim(),
      })
      .select('id, author_name, message, created_at')
      .single();

    if (error) {
      console.error('[api/album/comments] Insert error:', error);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('[api/album/comments] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
