import { NextRequest, NextResponse } from 'next/server';
import { writeLog } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await writeLog(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logging error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}
