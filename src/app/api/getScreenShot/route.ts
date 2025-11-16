import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import {
  IS_DOCKER,
  IS_REMOTE,
  SCREENSHOT_FILE_NAME,
  VERCEL_BLOB_CACHE_IMAGES_PATH,
  VERCEL_BLOB_PATH,
} from '../parse-megogo/const';

export async function GET() {
  let screenshotPath;

  if (IS_REMOTE && !IS_DOCKER) {
    screenshotPath =
      VERCEL_BLOB_PATH + VERCEL_BLOB_CACHE_IMAGES_PATH + SCREENSHOT_FILE_NAME;

    // Download file
    const blobRes = await fetch(screenshotPath);
    console.log('🚀 ~ GET ~ screenshotPath:', screenshotPath);
    console.log('🚀 ~ GET ~ blobRes:', blobRes);

    if (!blobRes.ok) {
      return NextResponse.json(
        { error: 'No screenshot found' },
        { status: 404 },
      );
    }

    return new NextResponse(blobRes.body, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${SCREENSHOT_FILE_NAME}"`, // Or 'attachment' for download
      },
    });
  }

  screenshotPath =
    IS_REMOTE && IS_DOCKER
      ? path.join('/tmp', 'screenshotFileName.png')
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
