import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { projectId, genre, era, artistReference } = await request.json();

    if (!projectId || !genre || !era) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getServiceSupabase();

    const musicProfile = {
      genre,
      era,
      ...(artistReference ? { artist_reference: artistReference } : {}),
    };

    const { error } = await db
      .from('projects')
      .update({ music_profile: musicProfile })
      .eq('id', projectId);

    if (error) {
      console.error('[api/profile] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/profile] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
