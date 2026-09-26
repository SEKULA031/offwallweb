import type { NextConfig } from 'next';
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const config: NextConfig = {
  outputFileTracingIncludes: {
    '/*': ['./assets/fonts/DejaVuSans.ttf', './public/dokumenti/obrazac-za-odustanak.pdf'],
  },
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  poweredByHeader: false,
  async redirects() {
    return ['theoffwall.com', 'offwallweb.vercel.app'].map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: 'https://www.theoffwall.com/:path*',
      permanent: true,
    }));
  },
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
          ...(process.env.VERCEL_ENV === 'preview'
            ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
            : []),
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
