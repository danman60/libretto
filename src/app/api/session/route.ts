import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('[api/session] POST - Creating new V2 session');
  try {
    const db = getServiceSupabase();
    const sessionToken = randomUUID();

    // Parse optional gift fields from body
    let isGift = false;
    let recipientName: string | null = null;
    let giftMessage: string | null = null;

    try {
      const body = await request.json();
      if (body.isGift) {
        isGift = true;
        recipientName = body.recipientName || null;
        giftMessage = body.giftMessage || null;
      }
    } catch {
      // No body or invalid JSON — that's fine, defaults apply
    }

    const { data, error } = await db
      .from('projects')
      .insert({
        session_token: sessionToken,
        version: 2,
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

    console.log('[api/session] Created V2 project:', data.id, isGift ? '(gift)' : '');
    return NextResponse.json({
      projectId: data.id,
      sessionToken: data.session_token,
    });
  } catch (err) {
    console.error('[api/session] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
