const { install } = require('@sparticuz/chromium');

(async () => {
  try {
    await install();
    console.log('Chromium installed successfully');
  } catch (e) {
    console.error('Failed to install Chromium:', e);
    process.exit(1);
  }
})();
