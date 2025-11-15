import { getTopModalText } from './getTopModalText';
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

  // const modal = await page.evaluate(() => {
  //   const elements = Array.from(
  //     document.querySelectorAll('*'),
  //   ) as HTMLElement[];

  //   function isVisible(el: HTMLElement) {
  //     const rect = el.getBoundingClientRect();
  //     const style = getComputedStyle(el);
  //     return (
  //       rect.width > 0 &&
  //       rect.height > 0 &&
  //       style.display !== 'none' &&
  //       style.visibility !== 'hidden' &&
  //       style.opacity !== '0'
  //     );
  //   }

  //   let best: { el: HTMLElement; score: number } | null = null;

  //   for (const el of elements) {
  //     if (!isVisible(el)) continue;

  //     const style = getComputedStyle(el);
  //     const rect = el.getBoundingClientRect();

  //     const z = parseInt(style.zIndex);
  //     const isFixed = style.position === 'fixed';
  //     const isCentered =
  //       rect.left < window.innerWidth * 0.25 &&
  //       rect.right > window.innerWidth * 0.75 &&
  //       rect.top < window.innerHeight * 0.25 &&
  //       rect.bottom > window.innerHeight * 0.75;

  //     const score =
  //       (isFixed ? 200 : 0) + (isCentered ? 500 : 0) + (isNaN(z) ? 0 : z);

  //     if (!best || score > best.score) {
  //       best = { el, score };
  //     }
  //   }

  //   return best ? best.el.outerHTML : null;
  // });
  // console.log('🚀 ~ parseMegogo ~ modal:', modal);

  // const topElement = await page.evaluate(() => {
  //   const x = window.innerWidth / 2;
  //   const y = window.innerHeight / 2;

  //   const el = document.elementFromPoint(x, y);
  //   return el ? el.outerHTML : null;
  // });
  // console.log('topElement', topElement);

  // const modalDeep = await getDeepText(
  //   page,
  //   '.adl_cmp_consent-dialog-module_backdrop lang-ru',
  // );
  // console.log('🚀 ~ parseMegogo ~ modal:', modalDeep);

  // await page.waitForSelector('body');
  // console.log('🚀 ~ parseMegogo ~ body:', await page.content());

  // await page.waitForSelector('body');

  // await page.waitForSelector(modalSelector, { visible: true });

  // const modalSelector = '#modal';
  // const modalDeep = await getDeepText(page, modalSelector);
  // console.log('🚀 ~ parseMegogo ~ modal:', modalDeep);

  const modalTOP = await getTopModalText(page);
  console.log('🚀 ~ parseMegogo ~ modalTOP:', modalTOP);

  //// 🖼️ Save screenshot to /tmp
  // const screenshotFileName = `screenshotFileName.png`;
  // const screenshotPath = isRemote
  //   ? `/tmp/${screenshotFileName}`
  //   : `public/${screenshotFileName}`;
  // await page.bringToFront();
  // await page.screenshot({ path: screenshotPath, fullPage: true });

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
