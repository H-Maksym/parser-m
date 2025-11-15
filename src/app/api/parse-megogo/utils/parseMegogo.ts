import { put } from '@vercel/blob';
import { isRemote, launchBrowser } from './puppeteer-config';

export async function parseMegogo(url: string) {
  console.log('🚀🚀🚀 Launching parseMegogo');

  const { browser, page } = await launchBrowser();
  // Блокуємо аналітику, рекламу, трекери
  if (!isRemote) {
    await page.setRequestInterception(true);
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

  // Завантаження сторінки з повним очікуванням
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

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
  const screenshotFileName = `screenshotFileName.png`;
  const screenshotPath = isRemote
    ? `/tmp/${screenshotFileName}`
    : `public/${screenshotFileName}`;
  await page.bringToFront();
  const buffer = await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
  //for Vercel
  const nodeBuffer = Buffer.from(buffer);
  await put(screenshotFileName, nodeBuffer, {
    access: 'public', // зробить файл доступним за URL
    allowOverwrite: true, //rewrite
  });

  ////   Click on button
  // const btnConsentAge = await page.evaluate(() => {
  //   const btn = document.querySelector(
  //     '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  //   );
  //   return btn ? btn.innerHTML : null;
  // });
  // console.log('🎬 btnAge:', btnConsentAge);

  if (!isRemote) {
    await page.click(
      '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
    );
  }

  if (!response || !response.ok()) {
    console.error(
      'Failed to load the page:',
      response ? response.status() : 'No response',
    );
  }
  console.log('✅ Page loaded with status:', response?.status());

  const pageTitle = await page.evaluate(() => {
    const h1 = document.querySelector('h1.video-title[itemprop="name"]');
    return h1 ? h1.textContent?.trim() : '';
  });
  console.log('🎬 Title:', pageTitle);

  // почекати вручну, якщо треба
  await new Promise(resolve => setTimeout(resolve, 5000));

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
  console.log('✅ Close browser:');

  await browser.close();

  // return { pageTitle: '', results: {} };
  return { pageTitle, results };
}
