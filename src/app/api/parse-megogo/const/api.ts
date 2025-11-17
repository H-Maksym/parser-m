// API paths, keys, timeouts
import { IS_DOCKER } from './env';
import { IS_VERCEL, MILLISECONDS_IN_SECOND } from './index';

export const SCREENSHOT_FILE_NAME = `screenshotFileName.png`;

export const CACHE_EXPIRATION_TIME = 10 * 60 * MILLISECONDS_IN_SECOND; //

const CHROMIUM_PACK_PATH =
  'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

const DOCKER_CHROMIUM_PATH = '/usr/bin/chromium';

export const URL_CHROMIUM_PACK = IS_VERCEL
  ? CHROMIUM_PACK_PATH
  : IS_DOCKER
    ? DOCKER_CHROMIUM_PATH
    : undefined;
