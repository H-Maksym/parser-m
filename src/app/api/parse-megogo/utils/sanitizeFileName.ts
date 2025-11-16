export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // remove forbidden characters
    .replace(/\s+/g, '_') // spaces → underscores
    .slice(0, 100); // limit the length to not be too long
}
