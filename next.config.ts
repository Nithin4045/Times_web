import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import webpack from 'webpack';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config) => {
    // Use webpack.IgnorePlugin directly
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^cookies$/i,
      })
    );
    return config;
  },
  
  typescript: { ignoreBuildErrors: false },
  
  // Configure static file serving for uploads directory
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      {
        source: '/static/files/:path*',
        destination: '/api/static-files/:path*',
      },
    ];
  },
  
  // Add headers for file downloads
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);