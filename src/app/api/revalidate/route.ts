import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { secret } = body;

  // Simple protection: Ensure only Admin UI calls this (you can enhance this)
  if (secret !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  // Purge the Layout (Header/Footer)
  revalidatePath('/', 'layout');
  
  return NextResponse.json({ revalidated: true, now: Date.now() });
}