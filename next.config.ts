import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
      allowedOrigins: ['localhost:3000', '192.168.0.105:3000', '121.41.230.120:3000']
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'img.qidian.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // 允许 API 跨域访问 (主要用于移动端开发)
        source: '/api/:path*',
        headers: [
          // 移除 Credentials: true，因为 Origin 设为了 *
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
             key: 'Content-Security-Policy',
             value: "default-src 'self' blob:; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' data: https: blob:; connect-src 'self' blob: https: data:; worker-src 'self' blob: https://cdnjs.cloudflare.com; object-src 'self' blob:;"
          }
        ]
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,HEAD' },
        ]
      }
    ]
  }
};

export default nextConfig;
