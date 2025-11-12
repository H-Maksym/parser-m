export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // видаляємо заборонені символи
    .replace(/\s+/g, '_') // пробіли → підкреслення
    .slice(0, 100); // обмежити довжину, щоб не було занадто довгим
}
