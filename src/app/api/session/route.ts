import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { MusicalType } from '@/lib/types';

export async function POST(request: NextRequest) {
  console.log('[api/session] POST - Creating new session');
  try {
    const db = getServiceSupabase();
    const sessionToken = randomUUID();

    let musicalType: MusicalType | null = null;
    let idea: string | null = null;
    // Legacy fields
    let isGift = false;
    let recipientName: string | null = null;
    let giftMessage: string | null = null;

    try {
      const body = await request.json();
      musicalType = body.musicalType || null;
      idea = body.idea || null;
      if (body.isGift) {
        isGift = true;
        recipientName = body.recipientName || null;
        giftMessage = body.giftMessage || null;
      }
    } catch {
      // No body or invalid JSON
    }

    const { data, error } = await db
      .from('projects')
      .insert({
        session_token: sessionToken,
        version: 3,
        musical_type: musicalType,
        idea,
        is_gift: isGift,
        recipient_name: recipientName,
        gift_message: giftMessage,
      })
      .select('id, session_token')
      .single();

    if (error) {
      console.error('[api/session] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('[api/session] Created project:', data.id, musicalType ? `(${musicalType})` : '');
    return NextResponse.json({
      projectId: data.id,
      sessionToken: data.session_token,
    });
  } catch (err) {
    console.error('[api/session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
