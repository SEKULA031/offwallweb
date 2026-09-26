import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';
import { categories } from '@/lib/categories';
import { absoluteUrl } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, demo } = await getCatalog();
  if (demo) return [];
  return [
    ...[
      '/',
      '/posteri',
      '/informacije/kontakt',
      '/informacije/dostava',
      ...categories(products).map((c) => `/posteri/kategorija/${c.slug}`),
    ].map((path) => ({ url: absoluteUrl(path) })),
    ...products.map((p) => ({
      url: absoluteUrl(`/posteri/${p.slug}`),
      ...(p.updated_at ? { lastModified: p.updated_at } : {}),
      images: p.images.map(absoluteUrl),
    })),
  ];
}
