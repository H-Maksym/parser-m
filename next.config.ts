import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   serverComponentsExternalPackages: ['puppeteer-core'],
  // },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
  // output: 'standalone',
};

export default nextConfig;
