import chromium from '@sparticuz/chromium-min';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

const launchBrowser = async () => {
  const chromiumPack =
    'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

  const isVercel = !!process.env.AWS_REGION || !!process.env.VERCEL;
  if (isVercel) {
    return await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(chromiumPack),
      headless: true,

      defaultViewport: { width: 1280, height: 720 },
    });
  } else {
    const puppeteerLocal = await import('puppeteer');
    return await puppeteerLocal.default.launch({ headless: true });
  }
};

function generateCSV(
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

async function parseMegogo(url: string) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    // userAgentMetadata: { ... } // це можна пропустити, якщо не хочеш додавати метадані
  });

  await page.goto(url, { waitUntil: 'networkidle2' });

  const pageTitle = await page.evaluate(() => {
    const h1 = document.querySelector('h1.video-title[itemprop="name"]');
    return h1 ? h1.textContent?.trim() : '';
  });
  console.log('🚀 ~ parseMegogo ~ pageTitle:', pageTitle);

  const ulSeasonsList = await page.evaluate(() => {
    const el = document.querySelector('ul.seasons-list');
    return el ? el.innerHTML : null;
  });
  console.log('Page HTML snapshot:', ulSeasonsList);

  await page.waitForSelector('ul.seasons-list');

  const seasons = await page.$$eval('ul.seasons-list li a', links =>
    links.map(a => ({
      title: a.textContent?.trim() ?? '',
      href: (a as HTMLAnchorElement).href,
      dataId: a.getAttribute('data-season')
        ? JSON.parse(a.getAttribute('data-season')!).id
        : '',
    })),
  );
  console.log('🚀 ~ parseMegogo ~ seasons:', seasons);

  const results: Record<string, Array<{ title: string; url: string }>> = {};

  for (const season of seasons) {
    console.log('🚀 ~ parseMegogo ~ season:', season);
    await page.goto(season.href, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector(
      `.season-container[data-season-id="${season.dataId}"].is-loaded .cards-list`,
    );

    const nextSelector = '.season-container a[data-mgg-action="next"]';

    while (true) {
      const nextLink = await page.$(nextSelector);
      if (!nextLink) break;

      await page.evaluate(el => {
        el.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        );
      }, nextLink);

      await new Promise(r => setTimeout(r, 500));

      const isDisabled = await nextLink.evaluate(
        el =>
          el.classList.contains('disabled') ||
          el.getAttribute('aria-disabled') === 'true' ||
          el.hasAttribute('disabled'),
      );
      if (isDisabled) break;
    }

    const episodes = await page.$$eval(
      `.season-container[data-season-id="${season.dataId}"].is-loaded .cards-list .card`,
      cards =>
        cards
          .map(card => {
            const title =
              card.getAttribute('data-episode-title') ||
              card
                .querySelector('[data-episode-title]')
                ?.getAttribute('data-episode-title') ||
              '';
            const href = card.querySelector('a')?.getAttribute('href') ?? '';
            return {
              title,
              url: href ? new URL(href, window.location.origin).href : '',
            };
          })
          .filter(e => e.title && e.url),
    );

    results[season.title] = episodes;
  }

  await browser.close();

  return { pageTitle, results };
}

export async function POST(req: NextRequest) {
  try {
    // Отримуємо формат з query string (?format=csv або ?format=json)
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid URL' },
        { status: 400 },
      );
    }

    // Виконуємо парсинг (твоя функція)
    const { pageTitle, results } = await parseMegogo(url);

    if (format === 'csv') {
      const csv = generateCSV(pageTitle ?? '', results);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="episodes.csv"',
          // додатково можна додати:
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    // Якщо format не csv, повертаємо JSON
    return NextResponse.json({
      pageTitle,
      totalSeasons: Object.keys(results).length,
      data: results,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
