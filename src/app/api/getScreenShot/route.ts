import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
//https://parser-m.onrender.com/api/getScreenShot
export async function GET() {
  const isProd = process.env.NODE_ENV === 'production';

  const screenshotPath = isProd
    ? // ? path.join('/tmp', 'screenshotFileName.png')
      path.join('/public', 'screenshotFileName.png')
    : path.join(process.cwd(), 'public', 'screenshotFileName.png');

  if (!fs.existsSync(screenshotPath)) {
    return NextResponse.json({ error: 'No screenshot found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(screenshotPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="screenshotFileName.png"',
    },
  });
}
