import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST() {
  console.log('[api/session] POST - Creating new session');
  try {
    const db = getServiceSupabase();
    const sessionToken = randomUUID();

    const { data, error } = await db
      .from('projects')
      .insert({ session_token: sessionToken })
      .select('id, session_token')
      .single();

    if (error) {
      console.error('[api/session] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('[api/session] Created project:', data.id);
    return NextResponse.json({
      projectId: data.id,
      sessionToken: data.session_token,
    });
  } catch (err) {
    console.error('[api/session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
