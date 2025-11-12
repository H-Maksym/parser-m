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
