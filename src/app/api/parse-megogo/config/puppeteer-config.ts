import chromium from '@sparticuz/chromium';
import type { LaunchOptions, Page } from 'puppeteer-core';
import { IS_REMOTE, PROXY, URL_CHROMIUM_PACK } from '../const';
import { IS_VERCEL } from '../const/env';
// Type for Page
export type PuppeteerPage = Page;
let puppeteer: typeof import('puppeteer') | typeof import('puppeteer-core');

export async function launchBrowser() {
  let options: LaunchOptions;

  if (IS_REMOTE) {
    // Server puppeteer-core
    puppeteer = await import('puppeteer-core');
    options = {
      headless: true,
      protocolTimeout: 180_000,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // ignoreHTTPSErrors: true,
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
        // `--proxy-server=${PROXY}`,
        // '--disable-dev-shm-usage', // важливо для Render
      ],
      acceptInsecureCerts: true,
      executablePath: IS_VERCEL
        ? // ? await chromium.executablePath(URL_CHROMIUM_PACK)
          await chromium.executablePath(URL_CHROMIUM_PACK)
        : await chromium.executablePath(),
      defaultViewport: { width: 1366, height: 768 },
    };
  } else {
    // Local full puppeteer
    puppeteer = await import('puppeteer');
    options = {
      headless: true,
      pipe: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--proxy-server=${PROXY}`,
      ],

      defaultViewport: { width: 1366, height: 768 },
    };
  }

  let browser;

  if (IS_REMOTE) {
    browser = await puppeteer.launch(options);
    console.log(
      '🚀 ~ launchBrowser  -  Browser on server',
      await browser.version(),
    );
  } else {
    const puppeteerLocal = await import('puppeteer');
    browser = await puppeteerLocal.default.launch();
    console.log('🚀 ~ launchBrowser  - Browser local', await browser.version());
  }

  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  });

  await page.evaluateOnNewDocument(() => {
    const realGeo = 'ua';

    // Патчимо getAttribute
    const origGetAttr = Element.prototype.getAttribute;
    Element.prototype.getAttribute = function (name) {
      if (name === 'data-geo') return realGeo;
      return origGetAttr.call(this, name);
    };

    // Патчимо setAttribute
    const origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === 'data-geo') return; // блокуємо перезапис
      return origSetAttr.call(this, name, value);
    };

    // Чекаємо появи <html>
    const interval = setInterval(() => {
      const html = document.documentElement;
      if (html) {
        html.setAttribute('data-geo', realGeo);
        clearInterval(interval);
      }
    }, 1);
  });

  await page.evaluateOnNewDocument(() => {
    // @ts-expect-error mock chrome.runtime for tests
    window.googletag = {
      cmd: [],
      pubads: () => ({
        enableSingleRequest() {},
        collapseEmptyDivs() {},
        setCentering() {},
        addEventListener() {},
      }),
      enableServices() {},
    };
  });

  await page.evaluateOnNewDocument(() => {
    const realGeo = 'ua';

    // Патчимо getAttribute
    const origGetAttr = Element.prototype.getAttribute;
    Element.prototype.getAttribute = function (name) {
      if (name === 'data-geo') return realGeo;
      return origGetAttr.call(this, name);
    };

    // Патчимо setAttribute
    const origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === 'data-geo') return; // блокуємо перезапис
      return origSetAttr.call(this, name, value);
    };

    // Чекаємо появи <html>
    const interval = setInterval(() => {
      const html = document.documentElement;
      if (html) {
        html.setAttribute('data-geo', realGeo);
        clearInterval(interval);
      }
    }, 1);
  });

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // @ts-expect-error mock chrome.runtime for tests
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', {
      get: () => ['uk-UA', 'uk'],
    });
    // Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4] });
    // // Підміна data-geo для будь-якого елемента
    // document.addEventListener('DOMContentLoaded', () => {
    //   const elements = document.querySelectorAll('[data-geo]');
    //   elements.forEach(el => el.setAttribute('data-geo', 'ua'));
    // });
    console.log('🚀 ~ launchBrowser ~ evaluateOnNewDocument:');
  });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  await page.emulateTimezone('Europe/Kiev');

  // // Встановлення геолокації для сторінки (Київ)
  // const context = browser.defaultBrowserContext();
  // await context.overridePermissions('https://example.com', ['geolocation']); // заміни URL на потрібний сайт
  // await page.setGeolocation({ latitude: 50.4501, longitude: 30.5234 }); // Київ

  await page.setBypassCSP(true);

  // Error logging
  page.on('pageerror', err => console.error('❌ PAGE ERROR:', err));
  // page.on('requestfailed', req =>
  //   console.error('⚠️ Request failed:', req.url(), req.failure()),
  // );

  // Ad logging without Megogo API blocking
  page.on('requestfailed', req => {
    const url = req.url();
    if (url.includes('ads.') || url.includes('doubleclick')) {
      console.log('❌ Blocked ad:', url);
    }
  });

  return { browser, page };
}
