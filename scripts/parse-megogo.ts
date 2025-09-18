import puppeteer from 'puppeteer';

const BASE_URL = 'https://megogo.net/ua/view/68721-klub-vinks-shkola-charivnic.html';

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

  // Очікуємо появи списку сезонів
  await page.waitForSelector('ul.seasons-list');

  const seasonLinks = await page.$$eval('ul.seasons-list li a', (links) =>
    links.map((a) => ({
      title: a.textContent?.trim() ?? '',
      url: (a as HTMLAnchorElement).href,
      dataId: (a.parentElement as HTMLElement).dataset.id ?? '',
    })),
  );

  const results: Record<string, Array<{ title: string; url: string }>> = {};

  for (const season of seasonLinks) {
    console.log(`📦 Сезон: ${season.title}`);

    // Клікаємо по сезону
    await page.click(`ul.seasons-list li[data-id="${season.dataId}"]`);
    await page.waitForSelector(`.season-container[data-season-id="${season.dataId}"].is-loaded`);

    // Забираємо всі епізоди
    const episodes = await page.$$eval(
      `.season-container[data-season-id="${season.dataId}"] .cards-list > div`,
      (cards) =>
        cards.map((card) => {
          const title = card.querySelector('[data-episode-title]')?.getAttribute('data-episode-title') ?? '';
          const linkEl = card.querySelector('a');
          const url = linkEl ? (linkEl as HTMLAnchorElement).href : '';
          return { title, url };
        }),
    );

    results[season.title] = episodes;
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
}

scrape().catch((err) => {
  console.error('❌ Error:', err);
});