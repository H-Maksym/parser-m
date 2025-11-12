import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  const screenshotPath = path.join('/tmp', 'screenshotFileName.png');

  if (!fs.existsSync(screenshotPath)) {
    return NextResponse.json({ error: 'No screenshot found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(screenshotPath);
  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'image/png' },
  });
}
