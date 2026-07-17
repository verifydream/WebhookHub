import { NextResponse } from 'next/server';
import { getHub, saveEvent } from '@/lib/db';

const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const limitInfo = rateLimits.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > limitInfo.resetTime) {
    limitInfo.count = 1;
    limitInfo.resetTime = now + 60000;
  } else {
    limitInfo.count += 1;
  }

  rateLimits.set(ip, limitInfo);
  return limitInfo.count <= 100; // max 100 requests per minute
}

export async function POST(req, { params }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (ip !== 'unknown' && !checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const hubId = params.hubId || (await params).hubId;
  const hub = await getHub(hubId);
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
    method: 'POST', headers, body, rawBody, sourceIp: ip
  });

  return NextResponse.json({ received: true, event_id: event.id });
}

export async function GET(req, { params }) {
  return POST(req, { params });
}
