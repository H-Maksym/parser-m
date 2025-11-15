import chromium from '@sparticuz/chromium';
// import puppeteer from 'puppeteer-core';
import type { LaunchOptions, Page } from 'puppeteer-core';
// Type for Page
export type PuppeteerPage = Page;
let puppeteer: typeof import('puppeteer') | typeof import('puppeteer-core');
const proxy = process.env.PROXY || '195.114.7.6:8095';

export const isRemote =
  !!process.env.AWS_REGION ||
  !!process.env.IS_VERCEL ||
  !!process.env.IS_DOCKER ||
  !!process.env.IS_RENDER;

export const launchBrowser = async () => {
  const chromiumPack =
    'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

  // const isDocker = !!process.env.IS_DOCKER;

  const urlChromium =
    isRemote || process.env.IS_VERCEL ? chromiumPack : undefined;
  //   ? chromiumPack
  //   : isDocker
  //     ? '/usr/bin/chromium'
  //     : null;

  let options: LaunchOptions;

  if (isRemote) {
    // Server puppeteer-core
    puppeteer = await import('puppeteer-core');
    options = {
      headless: true,
      //added last for screen
      protocolTimeout: 180_000,
      protocol: 'cdp',
      // pipe: true,
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
        `--proxy-server=${proxy}`,
      ],
      // executablePath: await chromium.executablePath(), // Sparticuz автоматично підбирає шлях
      executablePath: await chromium.executablePath(urlChromium ?? undefined),
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
        '--disable-dev-shm-usage', // важливо для Render
      ],
      defaultViewport: { width: 1366, height: 768 },
    };
  }

  let browser;

  if (isRemote) {
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
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // @ts-expect-error mock chrome.runtime for tests
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'languages', {
      get: () => ['uk-UA', 'uk'],
    });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4] });
    // Підміна data-geo для будь-якого елемента
    document.addEventListener('DOMContentLoaded', () => {
      const elements = document.querySelectorAll('[data-geo]');
      elements.forEach(el => el.setAttribute('data-geo', 'ua'));
    });
    console.log('🚀 ~ launchBrowser ~ evaluateOnNewDocument:');
  });

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
  });

  // // Встановлення геолокації для сторінки (Київ)
  // const context = browser.defaultBrowserContext();
  // await context.overridePermissions('https://example.com', ['geolocation']); // заміни URL на потрібний сайт
  // await page.setGeolocation({ latitude: 50.4501, longitude: 30.5234 }); // Київ

  await page.setBypassCSP(true);

  // Логування помилок
  page.on('pageerror', err => console.error('❌ PAGE ERROR:', err));
  // page.on('requestfailed', req =>
  //   console.error('⚠️ Request failed:', req.url(), req.failure()),
  // );

  // Логування реклами без блокування Megogo API
  page.on('requestfailed', req => {
    const url = req.url();
    if (url.includes('ads.') || url.includes('doubleclick')) {
      console.log('❌ Blocked ad:', url);
    }
  });

  return { browser, page };
};
