import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   serverComponentsExternalPackages: ['puppeteer-core'],
  // },
  // images: {
  //   domains: ['aq5lxyx2aehguhrq.public.blob.vercel-storage.com'],
  // },

  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  // output: 'standalone',
};

export default nextConfig;
