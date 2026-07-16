import { NextResponse } from 'next/server';
import { getHub } from '@/lib/db';

export async function GET(req, { params }) {
  const hub = await getHub((await params).id);
  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(hub);
}
