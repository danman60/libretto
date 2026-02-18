import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    if (!projectId || !genres?.length || !vocalMode || !energy || !era) {
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
        console.error('Preferences update error:', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
      }
    } else {
      const { error } = await db
        .from('music_preferences')
        .insert(prefData);

      if (error) {
        console.error('Preferences insert error:', error);
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Preferences error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
