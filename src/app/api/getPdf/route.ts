///TODO Now in raw form. Make it to the end and make changes to the parser
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { IS_REMOTE } from '../parse-megogo/const';

export async function GET() {
  const pdfFileName = IS_REMOTE
    ? path.join('/tmp', 'pdfFileName.pdf')
    : path.join(process.cwd(), 'public', 'pdfFileName.pdf');

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
