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

// //Прочитати cookies
// const cookies = await browser.cookies();
// console.log('🚀 ~ parseMegogo ~ cookies:', cookies);

//// Find modal
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
