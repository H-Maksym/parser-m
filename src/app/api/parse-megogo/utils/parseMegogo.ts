import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const isRemote =
  !!process.env.AWS_REGION ||
  !!process.env.VERCEL ||
  !!process.env.IS_DOCKER ||
  !!process.env.IS_RENDER;

export const launchBrowser = async () => {
  // const chromiumPack =
  //   'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

  // const isDocker = !!process.env.IS_DOCKER;

  // const urlChromium = isRemote
  //   ? chromiumPack
  //   : isDocker
  //     ? '/usr/bin/chromium'
  //     : null;

  let browser;

  if (isRemote) {
    browser = await puppeteer.launch({
      headless: true,
      //added last for screen
      protocolTimeout: 180_000,
      protocol: 'cdp',
      pipe: true,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
      ],
      executablePath: await chromium.executablePath(), // Sparticuz автоматично підбирає шлях
      // executablePath: await chromium.executablePath(urlChromium ?? undefined),
      defaultViewport: { width: 1366, height: 768 },
    });
    console.log(
      '🚀 ~ launchBrowser  -  Browser on server',
      await browser.version(),
    );
  } else {
    const puppeteerLocal = await import('puppeteer');
    browser = await puppeteerLocal.default.launch({
      headless: true,
      pipe: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // важливо для Render
      ],
      defaultViewport: { width: 1366, height: 768 },
    });
    console.log('🚀 ~ launchBrowser  - Browser local', await browser.version());
  }

  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // @ts-expect-error mock chrome.runtime for tests
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', {
      get: () => ['uk-UA', 'uk'],
    });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4] });
    console.log('🚀 ~ launchBrowser ~ evaluateOnNewDocument:');
  });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  await page.setBypassCSP(true);

  // Логування реклами без блокування Megogo API
  page.on('requestfailed', req => {
    const url = req.url();
    if (url.includes('ads.') || url.includes('doubleclick')) {
      console.log('❌ Blocked ad:', url);
    }
  });

  return { browser, page };
};

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
  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

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

  await page.evaluate(() => {
    window.scrollBy(0, 1000); // -1500 прокручує вверх, 1500 вниз
  });

  // Saves the PDF to pdfFileName.pdf.
  await page.pdf({
    path: 'pdfFileName.pdf',
  });

  // 🖼️ Зберігаємо скріншот у /tmp
  const screenshotFileName = `screenshotFileName.png`;
  const screenshotPath = isRemote
    ? `/tmp/${screenshotFileName}`
    : `public/${screenshotFileName}`;
  await page.bringToFront();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // const consent = await page.$$eval('div[class*="consent"]', els =>
  //   els.map(el => ({
  //     text: el.innerText.trim(),
  //     class: el.className,
  //     html: el.outerHTML,
  //   })),
  // ); // повертає ElementHandle або null
  // console.log('🚀 ~ parseMegogo ~ consent:', consent);

  const btn = await page.$('.btn.consent-button');
  if (btn) {
    const btnAge = await page.evaluate(el => el.outerHTML, btn);
    console.log(btnAge);
  }

  // const dialog = await page.$$eval(
  //   'button[class*=".btn.consent-button"]',
  //   els =>
  //     els.map(el => ({
  //       text: el.innerText.trim(),
  //       class: el.className,
  //       html: el.outerHTML,
  //     })),
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
