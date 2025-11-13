import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

// https://parser-m.onrender.com/api/getScreenShot
export async function GET() {
  const pdfFileName = path.join('/tmp', 'pdfFileName.pdf');

  // Check if the file exists
  if (!fs.existsSync(pdfFileName)) {
    return NextResponse.json({ error: 'No pdf found' }, { status: 404 });
  }

  // Read the PDF file into a buffer
  const buffer = fs.readFileSync(pdfFileName);

  // Return the PDF response
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="pdfFileName.pdf"', // optional: inline or attachment
    },
  });
}
