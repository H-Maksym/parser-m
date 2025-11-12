export function generateCSV(
  pageTitle: string,
  results: Record<string, Array<{ title: string; url: string }>>,
): string {
  const csvRows: string[] = [];
  csvRows.push(`Title: ,${pageTitle}`);
  csvRows.push('');

  for (const [seasonTitle, episodes] of Object.entries(results)) {
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
