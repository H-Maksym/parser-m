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
  } else {
    const puppeteerLocal = await import('puppeteer');
    browser = await puppeteerLocal.default.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1366, height: 768 },
    });
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
  });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  await page.setBypassCSP(true);

  // Логування реклами без блокування Megogo API
  // page.on('requestfailed', req => {
  //   const url = req.url();
  //   if (url.includes('ads.') || url.includes('doubleclick')) {
  //     console.log('❌ Blocked ad:', url);
  //   }
  // });

  return { browser, page };
};

export async function parseMegogo(url: string) {
  const { browser, page } = await launchBrowser();

  // Блокуємо аналітику, рекламу, трекери
  // await page.setRequestInterception(true);
  // page.on('request', req => {
  //   const url = req.url();
  //   const blockedResources =
  //   [
  //     'google-analytics.com',
  //     'bluekai.com',
  //     'mgid.com',
  //     'admixer.net',
  //     'megogo.net/v5/tracker',
  //     'adtcdn.com',
  //     'googletagservices.com',
  //     'doubleclick.net',
  //     'googletagmanager.com',
  //     'gstatic.com/prebid',
  //   ];
  //   if (blockedResources.some(domain => url.includes(domain))) {
  //     // console.log('⛔ Blocked:', url);
  //     req.abort();
  //   } else {
  //     req.continue();
  //   }
  // });

  // Встановлюємо User-Agent
  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  // Логування помилок
  page.on('pageerror', err => console.error('❌ PAGE ERROR:', err));
  // page.on('requestfailed', req =>
  //   console.error('⚠️ Request failed:', req.url(), req.failure()),
  // );

  // Завантажуємо сторінку
  // завантаження з повним очікуванням
  // const response = await page.goto(url, {
  //   waitUntil: 'domcontentloaded',
  // });
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  //Прочитати кукіси
  //   const cookies = await page.cookies();
  //   console.log('🚀 ~ parseMegogo ~ cookies:', cookies);

  // 🖼️ Зберігаємо скріншот у /tmp
  const screenshotFileName = `screenshotFileName.png`;
  const screenshotPath = isRemote
    ? `/tmp/${screenshotFileName}`
    : `public/${screenshotFileName}`;

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const html = await page.content();
  console.log('---------  html  ---------', html);

  // Чекаємо поки кнопка з'явиться в DOM
  //   await page.waitForSelector(
  //     '.btn.type-white.consent-button.jsPopupConsent[data-element-code="continue"]',
  //     { timeout: 5000 },
  //   );

  const btnAge = await page.evaluate(() => {
    const btn = document.querySelector(
      '.btn.type-white.consent-button.jsPopupConsent[data-element-code="continue"]',
    );
    return btn ? btn.innerHTML : null;
  });
  console.log('🎬 btnAge:', btnAge);

  await new Promise(resolve => setTimeout(resolve, 5000));

  //  Клікаємо по кнопці
  await page.click(
    '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  );

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

  // const mainSectionHtml = await page.evaluate(() => {
  //   const main = document.querySelector(
  //     'main section.widget.videoView_v2.product-main div.videoView-episodes',
  //   );
  //   return main ? main.innerHTML : null;
  // });
  // console.log('🧾 Main element content:', mainSectionHtml);

  // чекати, поки серії завантажаться
  // await page.waitForFunction(
  //   () => {
  //     const list = document.querySelector('ul.seasons-list');
  //     return list && list.children.length > 0;
  //   },
  //   { timeout: 20000 },
  // );

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

  await browser.close();

  // // 📥 Зчитуємо скріншот у base64
  // const screenshotBase64 = await readFile(screenshotPath, {
  //   encoding: 'base64',
  // });

  // return { screenshotPath, screenshotBase64, pageTitle, results };
  return { pageTitle, results };
}
