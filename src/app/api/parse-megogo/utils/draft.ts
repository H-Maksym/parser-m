// // Блокуємо аналітику, рекламу, трекери
// await page.setRequestInterception(true);
// page.on('request', req => {
//   const url = req.url();
//   const blockedResources = [
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

// Прочитати кукіси
// const cookies = await browser.cookies();
// console.log('🚀 ~ parseMegogo ~ cookies:', cookies);

// const pageContents = await page.content();
// console.log('🚀 ~ parseMegogo ~ pageContents:', pageContents);

// const pageFrames = await page.frames();
// console.log('🚀 ~ parseMegogo ~ pageFrames:', pageFrames);

// const searchText = 'Принять все';
// const searchText2 = 'Принять только';

// Знайти елементи
// const elements = await page.waitForSelector('button, a, p, div, h1, h2, h3', {
//   visible: true,
//   hidden: true,
//   timeout: 5000,
// });

// for (const el of elements) {
//   const text = await page.evaluate(
//     el => el.textContent.trim().toLowerCase(),
//     el,
//   );
//   if (text.includes(searchText.trim().toLowerCase())) {
//     // 🔍 тут умова пошуку по контенту
//     const includesHtml = await page.evaluate(el => el.outerHTML, el);
//     console.log('=== MATCH ===');
//     console.log('🚀 ~ parseMegogo ~ includesHtml:', includesHtml);
//   }

//   if (text.includes(searchText2.trim().toLowerCase())) {
//     // 🔍 тут умова пошуку по контенту
//     const includesHtml2 = await page.evaluate(el => el.outerHTML, el);
//     console.log('=== MATCH ===');
//     console.log('🚀 ~ parseMegogo ~ includesHtml:', includesHtml2);
//   }
// }

// Чекаємо поки кнопка з'явиться в DOM
// await page.waitForSelector(
//   '.btn.type-white.consent-button.jsPopupConsent[data-element-code="continue"]',
//   { timeout: 5000 },
// );

// Знайти div з текстом "Подтверждаю"

// const button = await page.$eval('div.consent-content', el => el.outerHTML);
// if (button) {
//   console.log('HTML елемента:\n', button);
// } else {
//   console.log('Елемент не знайдено');
// }

// const button = await page.waitForFunction(
//   () => {
//     return (
//       Array.from(document.querySelectorAll('div')).find(
//         el =>
//           el.textContent?.includes('Прийняти') ||
//           el.textContent?.includes('Підтверджую'),
//       ) || null
//     );
//   },
//   { timeout: 5000 },
// );

//Вивести всі кнопки
// const buttons = await page.$$eval('div', els =>
//   els.map(el => ({
//     text: el.innerText.trim(),
//     class: el.className,
//     attrs: Array.from(el.attributes).map(a => [a.name, a.value]),
//   })),
// );

// const btnCookies = await page.evaluate(() => {
//   const btn = Array.from(document.querySelectorAll('*')).find(
//     e => e.textContent.trim() === 'Прийняти',
//   );
//   return btn ? btn.classList : null;
// });
// console.log('🚀 ~ parseMegogo ~ btnCookies:', btnCookies);
