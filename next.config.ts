import type { NextConfig } from 'next';
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  poweredByHeader: false,
  images: {
    remotePatterns: supabase
      ? [
          {
            protocol: 'https',
            hostname: new URL(supabase).hostname,
            pathname: '/storage/v1/object/public/product-images/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
