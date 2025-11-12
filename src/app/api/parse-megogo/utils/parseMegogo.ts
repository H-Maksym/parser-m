import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

const isRemote =
  !!process.env.AWS_REGION ||
  !!process.env.VERCEL ||
  !!process.env.IS_DOCKER ||
  !!process.env.IS_RENDER;

export const launchBrowser = async () => {
  const chromiumPack =
    'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

  const isDocker = !!process.env.IS_DOCKER;

  const urlChromium = isRemote
    ? chromiumPack
    : isDocker
      ? '/usr/bin/chromium' // у Docker
      : null;

  let browser;

  if (isRemote) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1366,768',
        '--disable-gpu',
      ],
      executablePath: await chromium.executablePath(urlChromium ?? undefined),
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

  // 🧠 Маскування Puppeteer під справжній Chrome
  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  await page.evaluateOnNewDocument(() => {
    // ❌ Ховаємо, що це Puppeteer
    Object.defineProperty(navigator, 'webdriver', { get: () => false });

    // 🧩 Імітуємо Chrome API
    // @ts-expect-error mock chrome.runtime for tests
    window.chrome = { runtime: {} };

    // 🌐 Імітуємо мову користувача
    Object.defineProperty(navigator, 'languages', {
      get: () => ['uk-UA', 'uk'],
    });

    // 🔌 Імітуємо плагіни
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4],
    });
  });

  //навігація користувачем
  // await page.mouse.move(200, 200);
  // await page.mouse.click(200, 200);
  // await page.keyboard.press('ArrowDown');
  // await page.waitForTimeout(3000);

  // ✅ Дозволяємо рекламу і сторонні скрипти
  await page.setBypassCSP(true);

  // 🕵️‍♂️ Логування запитів (для дебагу)
  page.on('requestfailed', req => {
    console.log('❌ Blocked:', req.url());
  });
  page.on('requestfinished', req => {
    const url = req.url();
    if (
      url.includes('ads.') ||
      url.includes('megogo') ||
      url.includes('doubleclick')
    )
      console.log('✅ Loaded:', url);
  });
  return browser;
};

export async function parseMegogo(url: string) {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  //1️⃣ Логування DOM (щоб побачити, що реально бачить Puppeteer)
  await page.goto(url, { waitUntil: 'networkidle2' });

  const html = await page.content();
  console.log('🔍 Чи є popup у DOM:', html.includes('popup-21-consent'));
  console.log('🔍 Чи є кнопка:', html.includes('data-element-code="continue"'));

  // Логування помилок
  // page.on('pageerror', err => console.error('❌ PAGE ERROR:', err));
  // page.on('requestfailed', req =>
  //   console.error('⚠️ Request failed:', req.url(), req.failure()),
  // );

  // Завантажуємо сторінку
  // завантаження з повним очікуванням
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });

  //Прочитати кукіси
  const cookies = await page.cookies();
  console.log('🚀 ~ parseMegogo ~ cookies:', cookies);

  // 🖼️ Зберігаємо скріншот у /tmp
  const screenshotFileName = `screenshotFileName.png`;
  const screenshotPath = isRemote
    ? `/tmp/${screenshotFileName}`
    : `public/${screenshotFileName}`;

  await page.screenshot({ path: screenshotPath, fullPage: true });

  // await page.waitForFunction(
  //   () => {
  //     const btn = document.querySelector(
  //       '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  //     ) as HTMLElement | null; // кастинг
  //     return btn !== null && btn.offsetParent !== null; // перевіряємо видимість
  //   },
  //   { timeout: 30000 },
  // );

  await page.evaluate(() => {
    const btn = document.querySelector(
      '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
    ) as HTMLElement | null;
    console.log('🚀 ~ 🎬 btnAge - btn:', btn);
    if (btn) btn.click();
  });

  // await page.waitForSelector(
  //   '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  //   { visible: true, timeout: 10000 }, // чекаємо до 10 секунд
  // );
  // await page.click(
  //   '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  // );

  // const btnAge = await page.evaluate(() => {
  //   const btn = document.querySelector(
  //     '.btn.type-white.consent-button.jsPopupConsent[data-element-code="continue"]',
  //   );
  //   return btn ? btn.innerHTML : null;
  // });
  // console.log('🎬 btnAge:', btnAge);

  // await new Promise(resolve => setTimeout(resolve, 5000));

  // //  Клікаємо по кнопці
  // await page.click(
  //   '.btn.consent-button.jsPopupConsent[data-element-code="continue"]',
  // );

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
