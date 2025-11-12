// import chromium from '@sparticuz/chromium';
// import puppeteer from 'puppeteer-core';

// const isRemote =
//   !!process.env.AWS_REGION ||
//   !!process.env.VERCEL ||
//   !!process.env.IS_DOCKER ||
//   !!process.env.IS_RENDER;

// export const launchBrowser = async () => {
//   const chromiumPack =
//     'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

//   const isDocker = !!process.env.IS_DOCKER;

//   const urlChromium = isRemote
//     ? chromiumPack
//     : isDocker
//       ? '/usr/bin/chromium' // у Docker
//       : null;

//   let browser;

//   if (isRemote) {
//     browser = await puppeteer.launch({
//       headless: false,
//       args: [
//         ...chromium.args,
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         // '--disable-dev-shm-usage',
//         // '--window-size=1366,768',
//         // '--disable-gpu',
//       ],
//       executablePath: await chromium.executablePath(urlChromium ?? undefined),
//       defaultViewport: { width: 1366, height: 768 },
//     });
//   } else {
//     const puppeteerLocal = await import('puppeteer');
//     browser = await puppeteerLocal.default.launch({
//       headless: false,
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       defaultViewport: { width: 1366, height: 768 },
//     });
//   }

//   // 🧠 Маскування Puppeteer під справжній Chrome
//   const page = await browser.newPage();

//   await page.setUserAgent({
//     userAgent:
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
//   });

//   await page.evaluateOnNewDocument(() => {
//     // ❌ Ховаємо, що це Puppeteer
//     Object.defineProperty(navigator, 'webdriver', { get: () => false });

//     // 🧩 Імітуємо Chrome API
//     // @ts-expect-error mock chrome.runtime for tests
//     window.chrome = { runtime: {} };

//     // 🌐 Імітуємо мову користувача
//     Object.defineProperty(navigator, 'languages', {
//       get: () => ['uk-UA', 'uk'],
//     });

//     // 🔌 Імітуємо плагіни
//     Object.defineProperty(navigator, 'plugins', {
//       get: () => [1, 2, 3, 4],
//     });
//   });

//   //навігація користувачем
//   // await page.mouse.move(200, 200);
//   // await page.mouse.click(200, 200);
//   // await page.keyboard.press('ArrowDown');
//   // await page.waitForTimeout(3000);

//   await page.setExtraHTTPHeaders({
//     'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
//   });

//   // ✅ Дозволяємо рекламу і сторонні скрипти
//   await page.setBypassCSP(true);

//   // 🕵️‍♂️ Логування запитів (для дебагу)
//   page.on('requestfailed', req => {
//     const url = req.url();
//     if (url.includes('ads.') || url.includes('doubleclick')) {
//       console.log('❌ Blocked ad:', url);
//     }
//   });
//   // page.on('requestfinished', req => {
//   //   const url = req.url();
//   //   if (
//   //     url.includes('ads.') ||
//   //     url.includes('megogo') ||
//   //     url.includes('doubleclick')
//   //   )
//   //     console.log('✅ Loaded:', url);
//   // });
//   return {
//     browser,
//     page,
//   };
// };

// export async function parseMegogo(url: string) {
//   const { browser, page } = await launchBrowser();

//   // Відкриваємо сторінку
//   await page.goto(url, { waitUntil: 'networkidle2' });

//   // 1️⃣ Закриваємо popup 21+
//   const consentSelector =
//     '.btn.consent-button.jsPopupConsent[data-element-code="continue"]';
//   try {
//     await page.waitForSelector(consentSelector, {
//       visible: true,
//       timeout: 15000,
//     });
//     await page.click(consentSelector);
//     console.log('✅ Popup підтвердження віку закрито');
//   } catch (err) {
//     console.log('⚠️ Popup не з’явився або вже закритий');
//   }

//   // 2️⃣ Чекаємо на ul.seasons-list
//   try {
//     await page.waitForSelector('ul.seasons-list', {
//       visible: true,
//       timeout: 30000,
//     });
//   } catch (err) {
//     // Якщо таймаут — лог DOM для дебагу
//     const html = await page.content();
//     console.error(
//       '❌ Список сезонів не завантажився. Перевірте DOM:',
//       html.slice(0, 2000),
//     );
//     await browser.close();
//     return { pageTitle: null, results: {} };
//   }

//   // 3️⃣ Отримуємо назву відео
//   const pageTitle = await page.evaluate(() => {
//     const h1 = document.querySelector('h1.video-title[itemprop="name"]');
//     return h1 ? h1.textContent?.trim() : '';
//   });

//   // 4️⃣ Отримуємо сезони
//   const seasons = await page.$$eval('ul.seasons-list li a', links =>
//     links.map(a => ({
//       title: a.textContent?.trim() ?? '',
//       href: (a as HTMLAnchorElement).href,
//       dataId: a.getAttribute('data-season')
//         ? JSON.parse(a.getAttribute('data-season')!).id
//         : '',
//     })),
//   );

//   const results: Record<string, Array<{ title: string; url: string }>> = {};

//   // 5️⃣ Ітеруємо по сезонах
//   for (const season of seasons) {
//     await page.goto(season.href, { waitUntil: 'domcontentloaded' });

//     // Чекаємо контейнер з серіями
//     await page.waitForSelector(
//       `.season-container[data-season-id="${season.dataId}"].is-loaded .cards-list`,
//       { visible: true, timeout: 20000 },
//     );

//     const nextSelector = `.season-container a[data-mgg-action="next"]`;

//     // Пагінація
//     while (true) {
//       const nextLink = await page.$(nextSelector);
//       if (!nextLink) break;

//       await page.evaluate(el => {
//         el.dispatchEvent(
//           new MouseEvent('click', { bubbles: true, cancelable: true }),
//         );
//       }, nextLink);

//       await new Promise(r => setTimeout(r, 500));

//       const isDisabled = await nextLink.evaluate(
//         el =>
//           el.classList.contains('disabled') ||
//           el.getAttribute('aria-disabled') === 'true' ||
//           el.hasAttribute('disabled'),
//       );
//       if (isDisabled) break;
//     }

//     // Збираємо епізоди
//     const episodes = await page.$$eval(
//       `.season-container[data-season-id="${season.dataId}"].is-loaded .cards-list .card`,
//       cards =>
//         cards
//           .map(card => {
//             const title =
//               card.getAttribute('data-episode-title') ||
//               card
//                 .querySelector('[data-episode-title]')
//                 ?.getAttribute('data-episode-title') ||
//               '';
//             const href = card.querySelector('a')?.getAttribute('href') ?? '';
//             return {
//               title,
//               url: href ? new URL(href, window.location.origin).href : '',
//             };
//           })
//           .filter(e => e.title && e.url),
//     );

//     results[season.title] = episodes;
//   }

//   await browser.close();

//   return { pageTitle, results };
// }

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
      ? '/usr/bin/chromium'
      : null;

  let browser;

  if (isRemote) {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
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

  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // @ts-ignore
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
  page.on('requestfailed', req => {
    const url = req.url();
    if (url.includes('ads.') || url.includes('doubleclick')) {
      console.log('❌ Blocked ad:', url);
    }
  });

  return { browser, page };
};

export async function parseMegogo(url: string) {
  const { browser, page } = await launchBrowser();

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Закриваємо popup 21+
  const consentSelector =
    '.btn.consent-button.jsPopupConsent[data-element-code="continue"]';
  try {
    await page.waitForSelector(consentSelector, {
      visible: true,
      timeout: 15000,
    });
    await page.click(consentSelector);
    console.log('✅ Popup підтвердження віку закрито');
  } catch {
    console.log('⚠️ Popup не з’явився або вже закритий');
  }

  // Очікуємо ul.seasons-list з кількома спробами
  const maxRetries = 3;
  let listLoaded = false;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector('ul.seasons-list', {
        visible: true,
        timeout: 10000,
      });
      listLoaded = true;
      break;
    } catch {
      console.log(`⚠️ Спроба ${i + 1}: ul.seasons-list ще не завантажився`);
    }
  }

  if (!listLoaded) {
    const html = await page.content();
    console.error(
      '❌ Список сезонів не завантажився. Перевірте DOM:',
      html.slice(0, 2000),
    );
    await browser.close();
    return { pageTitle: null, results: {} };
  }

  // Назва відео
  const pageTitle = await page.evaluate(() => {
    const h1 = document.querySelector('h1.video-title[itemprop="name"]');
    return h1 ? h1.textContent?.trim() : '';
  });

  // Сезони
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
      { visible: true, timeout: 20000 },
    );

    // Пагінація (залишаємо твою логіку)
    const nextSelector = `.season-container a[data-mgg-action="next"]`;
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
