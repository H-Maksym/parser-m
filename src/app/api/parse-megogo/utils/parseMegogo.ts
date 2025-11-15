import { getDeepText } from './getDeepModal';
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

  // // Встановлюємо User-Agent
  // await page.setUserAgent({
  //   userAgent:
  //     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // });

  // Логування помилок
  page.on('pageerror', err => console.error('❌ PAGE ERROR:', err));
  // page.on('requestfailed', req =>
  //   console.error('⚠️ Request failed:', req.url(), req.failure()),
  // );

  // Завантаження сторінки з повним очікуванням
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // const bodyHTML = await page.evaluate(() => {
  //   const btn = document.querySelector('body');
  //   return btn ? btn.innerHTML : null;
  // });
  // console.log('🎬 btnAge:', bodyHTML);

  // await page.bringToFront();
  // await page.evaluate(() => {
  //   window.scrollBy(0, 1000); // -1500 прокручує вверх, 1500 вниз
  // });

  // Saves the PDF to pdfFileName.pdf.
  // await page.bringToFront();
  // await page.pdf({
  //   path: 'pdfFileName.pdf',
  // });

  // Знайти модалку
  // const topElement = await page.evaluate(() => {
  //   const x = window.innerWidth / 2;
  //   const y = window.innerHeight / 2;

  //   const el = document.elementFromPoint(x, y);
  //   return el ? el.outerHTML : null;
  // });
  // console.log('topElement', topElement);

  // const largeZIndex = await page.evaluate(() => {
  //   const elements = [...document.querySelectorAll('body *')];

  //   let maxZ = -Infinity;
  //   let top = null;

  //   for (const el of elements) {
  //     const style = window.getComputedStyle(el);
  //     const z = parseInt(style.zIndex);

  //     if (
  //       !isNaN(z) &&
  //       z > maxZ &&
  //       style.display !== 'none' &&
  //       style.visibility !== 'hidden'
  //     ) {
  //       maxZ = z;
  //       top = el;
  //     }
  //   }

  //   return top ? top.outerHTML : null;
  // });

  // console.log('largeZIndex', largeZIndex);

  // const modal = await page.evaluate(() => {
  //   const elements = [...document.querySelectorAll('body *')];
  //   const fixed = elements.filter(
  //     el => getComputedStyle(el).position === 'fixed',
  //   );
  //   const last = fixed[fixed.length - 1];
  //   return last ? last.outerHTML : null;
  // });

  // console.log('modal', modal);

  const modal = await page.evaluate(() => {
    const elements = Array.from(
      document.querySelectorAll('*'),
    ) as HTMLElement[];

    function isVisible(el: HTMLElement) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    }

    let best: { el: HTMLElement; score: number } | null = null;

    for (const el of elements) {
      if (!isVisible(el)) continue;

      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      const z = parseInt(style.zIndex);
      const isFixed = style.position === 'fixed';
      const isCentered =
        rect.left < window.innerWidth * 0.25 &&
        rect.right > window.innerWidth * 0.75 &&
        rect.top < window.innerHeight * 0.25 &&
        rect.bottom > window.innerHeight * 0.75;

      const score =
        (isFixed ? 200 : 0) + (isCentered ? 500 : 0) + (isNaN(z) ? 0 : z);

      if (!best || score > best.score) {
        best = { el, score };
      }
    }

    return best ? best.el.outerHTML : null;
  });
  console.log('🚀 ~ parseMegogo ~ modal:', modal);

  const modalDeep = await getDeepText(page, '#modal');
  console.log('🚀 ~ parseMegogo ~ modal:', modalDeep);

  // // 🖼️ Зберігаємо скріншот у /tmp
  // const screenshotFileName = `screenshotFileName.png`;
  // const screenshotPath = isRemote
  //   ? `/tmp/${screenshotFileName}`
  //   : `public/${screenshotFileName}`;
  // await page.bringToFront();
  // await page.screenshot({ path: screenshotPath, fullPage: true });

  // const consent = await page.$$eval('div[class*="consent"]', els =>
  //   els.map(el => ({
  //     text: el.innerText.trim(),
  //     class: el.className,
  //     html: el.outerHTML,
  //   })),
  // ); // повертає ElementHandle або null
  // console.log('🚀 ~ parseMegogo ~ consent:', consent);

  // const dialog = await page.$$eval('div[class*="popup"]', els =>
  //   els.map(el => ({
  //     text: el.innerText.trim(),
  //     class: el.className,
  //     html: el.outerHTML,
  //   })),
  // ); // повертає ElementHandle або null
  // console.log('🚀 ~ parseMegogo ~ button:', dialog);

  // const elementsWithText = await page.$$eval('*', els => {
  //   return els
  //     .filter(
  //       (el): el is HTMLElement =>
  //         el instanceof HTMLElement && el.innerText.includes('Принять'),
  //     )
  //     .map(el => ({
  //       tag: el.tagName,
  //       text: el.innerText.trim(),
  //       class: el.className,
  //       html: el.outerHTML,
  //     }));
  // });
  // console.log('🚀 ~ parseMegogo ~ elementsWithText:', elementsWithText);

  // console.log('🚀 ~ parseMegogo ~ elementsWithText:', elementsWithText);

  // const btn = await page.$$eval('button', els =>
  //   els.map(el => ({
  //     text: el.innerText.trim(),
  //     class: el.className,
  //     html: el.outerHTML,
  //   })),
  // ); // повертає ElementHandle або null
  // console.log('🚀 ~ parseMegogo ~ btn:', btn);

  // const bodyHTML = await page.$eval('body', el => el.innerText);
  // console.log('🚀 ~ parseMegogo ~ bodyHTML:', bodyHTML);
  //.scroll({    scrollLeft: 10,    scrollTop: 100,  });

  // const html = await page.content();
  // console.log('🚀 ~ parseMegogo ~ html:', html);
  // await new Promise(resolve => setTimeout(resolve, 5000));

  //  Клікаємо по кнопці
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
