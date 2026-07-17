import { NextResponse } from 'next/server';
import { createHub } from '@/lib/db';
import { nanoid } from 'nanoid';
import pool from '@/lib/db';

export async function POST(req) {
  const { name } = await req.json();
  const id = nanoid(12);
  const secret = nanoid(32);
  const hub = await createHub(id, name || 'My Hub', secret);
  return NextResponse.json(hub);
}

export async function GET(req) {
  const { rows } = await pool.query('SELECT * FROM hubs ORDER BY created_at DESC');
  return NextResponse.json(rows);
}
