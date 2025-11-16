import { Episode, ParserMegogoData } from '../types';

export function generateCSV(data: ParserMegogoData): string {
  const csvRows: string[] = [];
  const { pageTitle = '', results } = data;
  csvRows.push(`Title: ,${pageTitle}`);
  csvRows.push('');

  for (const [seasonTitle, episodes] of Object.entries(results) as [
    string,
    Episode[],
  ][]) {
    csvRows.push(`Season:,${seasonTitle}`);
    csvRows.push('Episode Title,URL');
    for (const ep of episodes) {
      const title = `"${ep.title.replace(/"/g, '""')}"`;
      const url = `"${ep.url.replace(/"/g, '""')}"`;
      csvRows.push(`${title},${url}`);
    }
    csvRows.push('');
  }

  return csvRows.join('\n');
}
