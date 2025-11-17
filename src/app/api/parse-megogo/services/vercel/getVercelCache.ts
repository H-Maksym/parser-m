import { BLOB_URL, VERCEL_BLOB_CACHE_PATH } from '../../const';

/**
 * Download cache from Vercel Blob Storage
 * @param fileName - name or url to cache file
 * @param maxAgeMs - (not necessary) max age cache in seconds
 * @returns object JSON or null, if cache absent / outstanding / not valid
 */
export async function getVercelCache(fileName: string, maxAgeMs?: number) {
  //TODO забрати в константу
  const url = BLOB_URL + VERCEL_BLOB_CACHE_PATH + fileName;

  try {
    //давай попрацюємо над отриманням з кешу з NEXTJS app роутер з In-Memory або Redis.
    const response = await fetch(url, {
      cache: 'no-cache',
      // cache: 'force-cache', // спробувати взяти з кеша, якщо є

      // /*fixed cache for Vercel*/ {
      //   cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        //     Pragma: 'no-cache',
        //     Expires: '0',
      },
    });
    console.log('🚀 ~ getVercelCache ~ response:', response);

    if (!response.ok) {
      console.warn(
        'File not found or the server returned an error:',
        response.status,
      );
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn("The file exists, but it's not JSON.");
      return null;
    }

    // If you need to check the cache date
    if (maxAgeMs) {
      const lastModified = response.headers.get('last-modified');
      console.log('🚀 ~ fetchVercelCache ~ lastModified:', lastModified);
      if (lastModified) {
        const modifiedTime = new Date(lastModified).getTime();
        const now = Date.now();
        if (now - modifiedTime > maxAgeMs) {
          console.log('Cash has expired.');
          return null;
        }
      }
    }

    // // SAFE JSON PARSING

    // const resData = await response.text();

    // if (!resData) {
    //   console.warn('Cache file is empty.');
    //   throw new Error();
    // }

    const data = await response.json();
    return data; // { pageTitle, results }
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}
