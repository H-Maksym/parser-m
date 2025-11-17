import { put, type PutBlobResult, type PutCommandOptions } from '@vercel/blob';
import { Results } from '../../types';
/**
 * Writes data to cache on Vercel Blob Storage *
 * @param fileName — cache file name or path
 * @param data — the object to save (eg `{ page Title, results }`)
 * @param options — additional options from Vercel Blob Options:
 *     - access: "public" or other,
 *     - allow Overwrite: whether an existing blob can be overwritten,
 *     - cache Control Max Age: max-age for cache control,
 *     - content Type: content type (default application/json)*/

// Тип об’єкта results: ключ — назва сезону (string), значення — масив епізодів

export async function putVercelCache(
  fileName: string,
  data: {
    pageTitle: string;
    results: Results;
  },
  options?: PutCommandOptions,
): Promise<PutBlobResult> {
  // Серіалізуємо дані в JSON
  const jsonString = JSON.stringify(data);

  // Let's prepare the options for put()
  const putOptions = {
    access: options?.access ?? 'public',
    allowOverwrite: options?.allowOverwrite ?? true,
    cacheControlMaxAge: options?.cacheControlMaxAge ?? 0, // 1 hour by default (in seconds)
    contentType: options?.contentType ?? 'application/json',
  };

  if (options?.cacheControlMaxAge != null) {
    // Add the Cache-Control header
    putOptions.cacheControlMaxAge = options.cacheControlMaxAge;
  }

  try {
    const blob = await put(fileName, jsonString, putOptions);
    console.log('✔️ Cache saved:');
    return blob; // Return information about the blob
  } catch (error) {
    console.error('❌ Error saving cache:', error);
    throw error;
  }
}
