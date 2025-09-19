//https://parser-m.onrender.com/api/debug

import fs from 'fs';
import path from 'path';

export async function GET() {
  const fileName = 'screenshotFileName.png';
  const filePath = path.join('/tmp', fileName);

  // 🔽 Лог потрапить у Render → Logs
  console.log('[DEBUG] Checking files in /tmp:', fs.readdirSync('/tmp'));

  if (!fs.existsSync(filePath)) {
    console.log(`[ERROR] File ${fileName} not found in /tmp`);
    return new Response(
      JSON.stringify({ error: `File ${fileName} not found in /tmp` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);

    console.log(
      `[SUCCESS] Serving file ${fileName} (${fileBuffer.length} bytes)`,
    );

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[ERROR] Failed to read file:', err);
    return new Response(
      JSON.stringify({ error: 'Error reading file', message: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
