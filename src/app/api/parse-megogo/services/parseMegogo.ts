import { put } from '@vercel/blob';
import { launchBrowser } from '../config';
import {
  IS_REMOTE,
  SCREENSHOT_FILE_NAME,
  VERCEL_BLOB_CACHE_IMAGES_PATH,
} from '../const';
import { ParserMegogoData, Results } from '../types';
import { extractHtmlName, StubKey } from '../utils';

export async function parseMegogo(url: string) {
  console.log('🚀🚀🚀 Launching parseMegogo');

  const { browser, page } = await launchBrowser();
  // Блокуємо аналітику, рекламу, трекери
  if (!IS_REMOTE) {
    await page.setRequestInterception(true);

    page.on('request', req => {
      if (req.url().includes('/geo')) {
        return req.respond({
          contentType: 'application/json',
          body: JSON.stringify({ country: 'ua' }),
        });
      }
      req.continue();
    });

    page.on('request', req => {
      const url = req.url();
      const blockedResources = [
        'google-analytics.com',
        'bluekai.com',
        'mgid.com',
        'admixer.net',
        'megogo.net/v5/tracker',
        'adtcdn.com',
        'googletagservices.com',
        'doubleclick.net',
        'googletagmanager.com',
        'gstatic.com/prebid',
      ];
      if (blockedResources.some(domain => url.includes(domain))) {
        // console.log('⛔ Blocked:', url);
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  // await page.setRequestInterception(true);
  // page.on('request', request => {
  //   // можна фільтрувати за URL (наприклад, м3u8, mp4 тощо)
  //   request.continue();
  // });

  // Пробуємо знайти елемент, що відповідає за текст помилок
  // Шукаємо всі стуби на сторінці
  // const stubs = await page.$$eval('[data-stub-name]', nodes =>
  //   nodes.map(n => n.getAttribute('data-stub-name')),
  // );

  // Переходимо на сервіс, який показує IP
  // const api64 = await page.goto('https://api64.ipify.org?format=json');
  // console.log('🚀 ~ parseMegogo ~ api64:', api64);

  // parsing JSON
  // const data = JSON.parse(content);
  // const content = await page.evaluate(() => document.body.innerHTML);
  // console.log('Поточний IP:', content);

  // Завантаження сторінки з повним очікуванням
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  //get all stubs
  // const stubs = await page.evaluate(() => {
  //   return Array.from(document.querySelectorAll('*')).flatMap(el =>
  //     Array.from(el.attributes)
  //       .filter(attr => attr.name.includes('stub'))
  //       .map(attr => ({
  //         tag: el.tagName.toLowerCase(),
  //         attribute: attr.name,
  //         value: attr.value,
  //       })),
  //   );
  // });
  // console.log('🚀 ~ parseMegogo ~ stubs:', stubs);

  // Saves the PDF to pdfFileName.pdf.
  // await page.bringToFront();
  // await page.pdf({
  //   path: 'pdfFileName.pdf',
  // });

  // await page.bringToFront();
  // await page.evaluate(() => {
  //   window.scrollBy(0, 1000); // -1500 прокручує вверх, 1500 вниз
  // });

  // Ждем контейнер диалога
  // await page.waitForSelector('.adl_cmp_consent-dialog-module_backdrop');

  // // Достаем shadow root и кнопку по тексту
  // const acceptAllButton = await page.evaluateHandle(() => {
  //   const backdrop = document.querySelector(
  //     '.adl_cmp_consent-dialog-module_backdrop',
  //   );
  //   const shadowRoot =
  //     backdrop.shadowRoot || backdrop.querySelector('template').content;
  //   const buttons = shadowRoot.querySelectorAll('button.buttonEl');
  //   // Ищем кнопку по точному тексту
  //   return Array.from(buttons).find(
  //     btn => btn.textContent.trim() === 'Принять все',
  //   );
  // });

  // // Кликаем по кнопке
  // await acceptAllButton.click();

  // 🖼️ Save screenshot to /tmp
  const screenshotPath = IS_REMOTE
    ? `/tmp/${SCREENSHOT_FILE_NAME}`
    : `public/${SCREENSHOT_FILE_NAME}`;

  await page.bringToFront();
  const buffer = await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  //Put to VercelBlob
  const nodeBuffer = Buffer.from(buffer);
  await put(VERCEL_BLOB_CACHE_IMAGES_PATH + SCREENSHOT_FILE_NAME, nodeBuffer, {
    access: 'public', // make the file available by URL
    allowOverwrite: true, //rewrite
  });

  if (!response || !response.ok()) {
    console.error(
      'Failed to load the page:',
      response ? response.status() : 'No response',
    );
  }
  console.log('✅ Page loaded with status:', response?.status());

  if (!IS_REMOTE) {
    await page.click(
      '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
    );
  }
  const content = await page.content();
  console.log('🚀 ~ parseMegogo ~ content:', content);

  const pageTitle = await page.evaluate(() => {
    const h1 = document.querySelector('h1.video-title[itemprop="name"]');
    return h1 ? h1.textContent?.trim() : '';
  });
  console.log('🎬 Title:', pageTitle);

  // check the availability of the video in the region
  const stubName: StubKey = 'geoUnavailable';
  const isGeoUnavailable =
    (await page.$(`[data-stub-name=${stubName}]`)) !== null;

  if (isGeoUnavailable) {
    const geoRegion = await page.evaluate(() =>
      document
        .querySelector('[data-geo]')
        ?.getAttribute('data-geo')
        ?.toUpperCase(),
    );

    console.log(
      `⚠️ The video by ${pageTitle} is not available in your ${geoRegion} region.`,
    );

    const data: ParserMegogoData = {
      pageTitle: `Attention!!! - Video "- ${pageTitle} -" is not available in "- ${geoRegion} -" region.`,
      results: {
        [pageTitle]: [
          {
            title: pageTitle,
            url,
            fileName: extractHtmlName(url),
          },
        ],
      },
    };
    await browser.close();
    return data;
  }
  console.log('✅ Video is available.');

  // почекати вручну, якщо треба
  // await new Promise(resolve => setTimeout(resolve, 5000));

  const seasons = await page.$$eval('ul.seasons-list li a', links =>
    links.map(a => ({
      title: a.textContent?.trim() ?? '',
      href: (a as HTMLAnchorElement).href,
      dataId: a.getAttribute('data-season')
        ? JSON.parse(a.getAttribute('data-season')!).id
        : '',
    })),
  );

  if (!seasons.length) {
    // logic for the case without seasons
    const data: ParserMegogoData = {
      pageTitle,
      results: {
        [pageTitle]: [
          {
            title: pageTitle,
            url,
            fileName: extractHtmlName(url),
          },
        ],
      },
    };
    await browser.close();
    return data;
  }

  const results: Results = {};

  for (const season of seasons) {
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
            const url = href ? new URL(href, window.location.origin).href : '';

            return {
              title,
              url,
            };
          })
          .filter(e => e.title && e.url),
    );

    const processedEpisodes = episodes
      .filter(ep => ep.title && ep.url)
      .map(ep => ({
        ...ep,
        fileName: extractHtmlName(ep.url),
      }));

    results[season.title] = processedEpisodes;
  }
  console.log('✅ Close browser:');

  await browser.close();
  return { pageTitle, results };
}
