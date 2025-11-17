import { BlobAccessError } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import {
  CACHE_EXPIRATION_TIME,
  IS_VERCEL_CACHE,
  VERCEL_BLOB_CACHE_PATH,
} from './const';

import { memoryCache } from './infrastructure/performance';
import {
  generateCSV,
  generateExcel,
  getVercelCache,
  parseMegogo,
  putVercelCache,
} from './services';
import { ParserMegogoData } from './types';
import { cleanUrl, sanitizeFileName } from './utils';

export async function POST(req: NextRequest) {
  try {
    //Get url from form
    const { url: fullURL } = await req.json();
    const url = cleanUrl(fullURL);

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid URL' },
        { status: 400 },
      );
    }

    // Get format  by query string (?format=csv або ?format=json)
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    //Check cache from VercelBlob
    const saveFileName = sanitizeFileName(url).replace('.html', '.json');

    let data: ParserMegogoData;

    //caching by run-time
    data = await memoryCache.cached(saveFileName, CACHE_EXPIRATION_TIME, () =>
      parseMegogo(url),
    );

    if (IS_VERCEL_CACHE) {
      const cacheResult = await getVercelCache(saveFileName, 100 * 60 * 1000);
      if (cacheResult) {
        data = cacheResult;
        console.log('🚀 ~ Returning cached data from Vercel Blob.');
      } else {
        data = await parseMegogo(url);
        await putVercelCache(`${VERCEL_BLOB_CACHE_PATH + saveFileName}`, data);
      }
    }

    const { pageTitle, results } = data;

    if (format === 'csv') {
      const csv = generateCSV(data);
      const safeFileName = sanitizeFileName(pageTitle || 'episodes');
      const encodedFileName = encodeURIComponent(safeFileName); //для кирилиці

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="episodes.csv"; filename*=UTF-8''${encodedFileName}.csv`,
          // can be additionally added:
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    if (format === 'excel') {
      const excelBuffer = generateExcel(data);
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

    return NextResponse.json({
      pageTitle,
      totalSeasons: Object.keys(results).length,
      data: results,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    //Handling errors from Vercel
    if (error instanceof BlobAccessError) {
      console.log('error from Vercel Blob');
    } else {
      // throw the error again if it's unknown
      throw error;
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
