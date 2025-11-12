import * as XLSX from 'xlsx';

export function generateExcel(
  pageTitle: string,
  results: Record<string, Array<{ title: string; url: string }>>,
): Buffer {
  const workbook = XLSX.utils.book_new();

  //на різні листи.
  // for (const [seasonTitle, episodes] of Object.entries(results)) {
  //   const sheetData = [
  //     [`Title:`, pageTitle], // 🆕 перший рядок — заголовок сторінки
  //     [], // порожній рядок
  //     ['Episode Title', 'URL'], // заголовки колонок
  //   ];

  //   for (const ep of episodes) {
  //     sheetData.push([ep.title, ep.url]);
  //   }

  //   const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  //   XLSX.utils.book_append_sheet(workbook, worksheet, seasonTitle.slice(0, 31));
  // }

  const sheetData: (string | null)[][] = [
    ['Title:', pageTitle],
    [],
    ['Season', 'Episode Title', 'URL'],
  ];

  const seasons = Object.entries(results);
  seasons.forEach(([seasonTitle, episodes], index) => {
    for (const ep of episodes) {
      sheetData.push([seasonTitle, ep.title, ep.url]);
    }

    // ✅ Додаємо порожній рядок, якщо це не останній сезон
    if (index < seasons.length - 1) {
      sheetData.push([]);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Episodes');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}
