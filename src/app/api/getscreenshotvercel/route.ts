import { NextResponse } from 'next/server';

export async function GET() {
  // URL of Blob Storage
  //process.env.BLOB_URL="https://parser-m.vercel.app/"
  const isVercel = process.env.IS_VERCEL;
  const fileUrl = `${process.env.BLOB_URL}/screenshotFileName.png`;

  if (!isVercel) {
    return NextResponse.json(
      { message: 'This endpoint is only available on Vercel.' },
      { status: 400 },
    );
  }

  // Download file
  const res = await fetch(fileUrl);

  if (!res.ok) {
    return NextResponse.json({ error: 'No screenshot found' }, { status: 404 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="screenshotFileName.png"',
    },
  });
}
