import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('[api/preferences] POST');
  try {
    const body = await request.json();
    const {
      projectId,
      genres,
      artists,
      favoriteSongs,
      vocalMode,
      energy,
      era,
      allowRealNames,
    } = body;

    console.log('[api/preferences] projectId:', projectId, 'genres:', genres);

    if (!projectId || !genres?.length || !vocalMode || !energy || !era) {
      console.log('[api/preferences] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Upsert preferences
    const { data: existing } = await db
      .from('music_preferences')
      .select('id')
      .eq('project_id', projectId)
      .single();

    const prefData = {
      project_id: projectId,
      genres,
      artists: artists || [],
      favorite_songs: favoriteSongs || [],
      vocal_mode: vocalMode,
      energy,
      era,
      allow_real_names: allowRealNames || false,
    };

    if (existing) {
      const { error } = await db
        .from('music_preferences')
        .update(prefData)
        .eq('id', existing.id);

      if (error) {
        console.error('[api/preferences] Update error:', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }
      console.log('[api/preferences] Updated existing row');
    } else {
      const { error } = await db
        .from('music_preferences')
        .insert(prefData);

      if (error) {
        console.error('[api/preferences] Insert error:', error);
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
      }
      console.log('[api/preferences] Inserted new row');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/preferences] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
