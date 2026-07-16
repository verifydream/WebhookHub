import { NextResponse } from 'next/server';
import { getEvents } from '@/lib/db';

export async function GET(req, { params }) {
  const events = await getEvents((await params).id);
  return NextResponse.json(events);
}
