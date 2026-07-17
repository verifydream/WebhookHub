import { NextResponse } from 'next/server';
import { getHub, deleteHub } from '@/lib/db';

export async function GET(req, { params }) {
  const hub = await getHub(params.id);
  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(hub);
}

export async function DELETE(req, { params }) {
  const id = params.id;
  const hub = await getHub(id);
  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteHub(id);

  return NextResponse.json({ deleted: true });
}
