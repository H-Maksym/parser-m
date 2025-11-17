export function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    // collect again the basic URL without query and hash
    return `${u.origin}${u.pathname}`;
  } catch {
    return '';
  }
}
