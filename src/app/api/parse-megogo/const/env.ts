// clean process.env variables

//Vercel Blob
export const BLOB_URL =
  process.env.BLOB_URL ||
  'https://aq5lxyx2aehguhrq.public.blob.vercel-storage.com/';

export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
export const VERCEL_BLOB_CACHE_PATH =
  process.env.VERCEL_BLOB_CACHE_PATH || 'cache/parser-m/';
export const VERCEL_BLOB_CACHE_IMAGES_PATH =
  process.env.VERCEL_BLOB_CACHE_IMAGES_PATH || 'cache/parser-m/images/';
export const IS_VERCEL_CACHE = process.env.IS_VERCEL_CACHE;

//environment for different deploy
export const IS_AWS = process.env.IS_AWS;
export const IS_VERCEL = process.env.IS_VERCEL;
export const IS_DOCKER = process.env.IS_DOCKER;
export const IS_RENDER = process.env.IS_RENDER;

//imitate ukraine fetch
export const PROXY = process.env.PROXY || '159.224.232.194:8888';
