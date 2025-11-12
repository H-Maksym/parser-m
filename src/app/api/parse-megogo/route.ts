import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSV,
  generateExcel,
  parseMegogo,
  sanitizeFileName,
} from './utils';

export async function POST(req: NextRequest) {
  try {
    // Отримуємо формат з query string (?format=csv або ?format=json)
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid URL' },
        { status: 400 },
      );
    }

    // Виконуємо парсинг (твоя функція)
    const { pageTitle, results } = await parseMegogo(url);

    if (format === 'csv') {
      const csv = generateCSV(pageTitle ?? '', results);
      const safeFileName = sanitizeFileName(pageTitle || 'episodes');
      const encodedFileName = encodeURIComponent(safeFileName); //для кирилиці

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="episodes.csv"; filename*=UTF-8''${encodedFileName}.csv`,
          // додатково можна додати:
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    if (format === 'excel') {
      const excelBuffer = generateExcel(pageTitle ?? '', results);
      const safeFileName = sanitizeFileName(pageTitle || 'episodes');
      const encodedFileName = encodeURIComponent(safeFileName); //для кирилиці

      return new NextResponse(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="episodes.xlsx"; filename*=UTF-8''${encodedFileName}.xlsx`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    // Якщо format не csv, повертаємо JSON + скріншот
    return NextResponse.json({
      // screenshotPath,
      // screenshot: `data:image/png;base64,${screenshotBase64}`,
      pageTitle,
      totalSeasons: Object.keys(results).length,
      data: results,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
