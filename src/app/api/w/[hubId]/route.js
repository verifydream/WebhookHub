import { NextResponse } from 'next/server';
import { getHub, saveEvent } from '@/lib/db';

export async function POST(req, { params }) {
  const hub = await getHub((await params).hubId);
  if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 });

  const headers = Object.fromEntries(req.headers.entries());
  delete headers.authorization;
  delete headers.cookie;

  let body = null, rawBody = null;
  try {
    const text = await req.text();
    rawBody = text;
    body = JSON.parse(text);
  } catch { body = null; }

  const event = await saveEvent(hub.id, {
    method: 'POST', headers, body, rawBody, sourceIp: headers['x-forwarded-for'] || 'unknown'
  });

  return NextResponse.json({ received: true, event_id: event.id });
}

export async function GET(req, { params }) {
  // Also accept GET for webhook testing
  return POST(req, { params });
}
