import { NextResponse } from 'next/server';
import { generateDocs } from '@/lib/db';

export async function GET(req, { params }) {
  const md = await generateDocs((await params).id);
  return new NextResponse(md, { headers: { 'Content-Type': 'text/markdown' } });
}
