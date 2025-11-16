import * as XLSX from 'xlsx';
import { ParserMegogoData } from '../types';

export function generateExcel(data: ParserMegogoData): Buffer {
  const workbook = XLSX.utils.book_new();
  const { pageTitle = '', results } = data;
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

    // ✅ We add an empty line if this is not the last season
    if (index < seasons.length - 1) {
      sheetData.push([]);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Episodes');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

// Download seasons for different letters in one file.
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
