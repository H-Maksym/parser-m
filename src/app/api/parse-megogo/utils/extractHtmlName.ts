export function extractHtmlName(url: string) {
  const match = url.match(/([^\/]+\.html)/);
  return match ? match[1] : null;
}
