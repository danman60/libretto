import { NextResponse } from 'next/server';

export const maxDuration = 120;

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check env var
  const key = process.env.KIE_API_KEY;
  results.hasKey = !!key;
  results.keyPrefix = key ? key.substring(0, 8) + '...' : 'NOT SET';

  if (!key) {
    return NextResponse.json(results);
  }

  // 2. Credit check
  try {
    const creditRes = await fetch('https://api.kie.ai/api/v1/chat/credit', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const creditData = await creditRes.json();
    results.creditCheck = { status: creditRes.status, data: creditData };
  } catch (err) {
    results.creditCheck = { error: String(err) };
  }

  // 3. Submit a test generation (will consume ~5 credits)
  try {
    const submitRes = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: false,
        model: 'V4_5',
        title: 'Diagnostic Test',
        style: 'Indie Folk, warm',
        prompt: '[Verse]\nThis is a diagnostic test\nJust checking if KIE works\n\n[Chorus]\nLa la la',
        callBackUrl: process.env.KIE_CALLBACK_URL || 'https://webhook.site/placeholder',
      }),
    });
    const submitText = await submitRes.text();
    results.submit = {
      status: submitRes.status,
      headers: Object.fromEntries(submitRes.headers.entries()),
      body: submitText,
    };

    // 4. If submit worked, poll once after 10s
    let parsed;
    try { parsed = JSON.parse(submitText); } catch { /* ignore */ }
    if (parsed?.data?.taskId) {
      results.taskId = parsed.data.taskId;
      await new Promise(r => setTimeout(r, 10000));
      const pollRes = await fetch(
        `https://api.kie.ai/api/v1/generate/record-info?taskId=${parsed.data.taskId}`,
        { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
      );
      const pollText = await pollRes.text();
      results.firstPoll = { status: pollRes.status, body: pollText };
    }
  } catch (err) {
    results.submit = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
