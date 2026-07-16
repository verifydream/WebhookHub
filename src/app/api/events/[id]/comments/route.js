import { NextResponse } from 'next/server';
import { addComment, getComments } from '@/lib/db';

export async function GET(req, { params }) {
  const comments = await getComments(parseInt((await params).id));
  return NextResponse.json(comments);
}

export async function POST(req, { params }) {
  const { author, content } = await req.json();
  const comment = await addComment(parseInt((await params).id), author, content);
  return NextResponse.json(comment);
}
