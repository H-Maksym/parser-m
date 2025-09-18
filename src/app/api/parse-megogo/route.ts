//     const BASE_URL = url;
// 'https://megogo.net/ua/view/10411212-megamen-povniy-zaryad.html';
// https: const BASE_URL =
//   'https://megogo.net/ua/view/68721-klub-vinks-shkola-charivnic.html';

import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const dynamic = 'force-dynamic'; // 👈 важливо для Next.js App Router

// Функція для генерації CSV із результатів
function generateCSV(
  pageTitle: string,
  results: Record<string, Array<{ title: string; url: string }>>,
): string {
  const csvRows: string[] = [];

  csvRows.push(`Title: ,${pageTitle}`);
  csvRows.push(''); // Порожній рядок

  for (const [seasonTitle, episodes] of Object.entries(results)) {
    csvRows.push(`Season:,${seasonTitle}`);
    csvRows.push('Episode Title,URL');

    for (const episode of episodes) {
      const title = `"${episode.title.replace(/"/g, '""')}"`;
      const url = `"${episode.url.replace(/"/g, '""')}"`;
      csvRows.push(`${title},${url}`);
    }

    csvRows.push(''); // Порожній рядок між сезонами
  }

  return csvRows.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid URL' },
        { status: 400 },
      );
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const pageTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1.video-title[itemprop="name"]');
      return h1 ? h1.textContent?.trim() : '';
    });

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

    const results: Record<string, Array<{ title: string; url: string }>> = {};

    for (const season of seasons) {
      console.log(`🔍 Парсимо сезон: ${season.title}`);

      await page.goto(season.href, { waitUntil: 'domcontentloaded' });

      await page.waitForSelector(
        `.season-container[data-season-id="${season.dataId}"].is-loaded .cards-list`,
      );

      // Натискай кнопку прокрутки поки є і не disabled
      const nextSelector = '.season-container a[data-mgg-action="next"]';

      while (true) {
        const nextLink = await page.$(nextSelector);
        if (!nextLink) break;

        await page.evaluate(el => {
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          el.dispatchEvent(event);
        }, nextLink);

        console.log('✅ Клік виконано');
        await new Promise(r => setTimeout(r, 500));

        const isDisabled = await nextLink.evaluate(
          el =>
            el.classList.contains('disabled') ||
            el.getAttribute('aria-disabled') === 'true' ||
            el.hasAttribute('disabled'),
        );

        if (isDisabled) {
          console.log('🚫 Кнопка стала disabled — вихід з циклу');
          break;
        }
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
            .filter(episode => episode.title && episode.url),
      );

      results[season.title] = episodes;
    }

    const csv = generateCSV(pageTitle ?? '', results);
    fs.writeFileSync('./public/episodes.csv', csv);

    await browser.close();

    return NextResponse.json({
      totalSeasons: seasons.length,
      pageTitle,
      data: results,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
