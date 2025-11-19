export function getFilenameFromDisposition(
  disposition: string | null,
  fallback = 'episodes.csv',
) {
  if (!disposition || typeof disposition !== 'string') {
    return fallback;
  }

  // UTF-8 filename* (RFC 5987)
  const filenameStarMatch = disposition.match(/filename\*=UTF-8''([^;\n]*)/);

  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1]);
    } catch {
      // у разі помилки декодування
      return filenameStarMatch[1];
    }
  }

  // Old ASCII filename=""
  const filenameMatch = disposition.match(/filename="([^"]+)"/);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return fallback;
}
