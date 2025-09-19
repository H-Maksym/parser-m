import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  const fileName = 'screenshotFileName.png';
  const filePath = path.join('/tmp', fileName);

  // 🔽 Цей лог потрапить у Render → Logs
  console.log('[DEBUG] Checking files in /tmp:', fs.readdirSync('/tmp'));

  if (!fs.existsSync(filePath)) {
    console.log(`[ERROR] File ${fileName} not found in /tmp`);
    res.status(404).json({ error: `File ${fileName} not found in /tmp` });
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);

    console.log(
      `[SUCCESS] Serving file ${fileName} (${fileBuffer.length} bytes)`,
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.status(200).send(fileBuffer);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[ERROR] Failed to read file:', err);
    res.status(500).json({ error: 'Error reading file', message: err.message });
  }
}
