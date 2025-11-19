const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  executablePath: '/opt/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};
