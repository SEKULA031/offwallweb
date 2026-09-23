import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { products } = await getCatalog();
  return ['', '/posteri', ...products.map((p) => `/posteri/${p.slug}`)].map((path) => ({
    url: base + path,
  }));
}
