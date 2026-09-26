import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
import { categories } from '@/lib/categories';
import { pageMetadata } from '@/lib/seo';
import { Catalog } from '@/components/catalog';
import { CategoryLinks } from '@/components/category-links';
import { Breadcrumbs } from '@/components/breadcrumbs';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  const { products, demo } = await getCatalog();
  const c = categories(products).find((c) => c.slug === category);
  if (!c) notFound();
  return pageMetadata(
    c.title,
    c.intro,
    `/posteri/kategorija/${c.slug}`,
    products.find((p) => p.category === c.name)?.images[0],
    demo,
  );
}
export default async function Category({ params }: Props) {
  const { category } = await params;
  const { products, demo } = await getCatalog();
  const c = categories(products).find((c) => c.slug === category);
  if (!c) notFound();
  return (
    <section className="section stack">
      <Breadcrumbs
        items={[
          { name: 'Početna', href: '/' },
          { name: 'Posteri', href: '/posteri' },
          { name: c.title, href: `/posteri/kategorija/${c.slug}` },
        ]}
      />
      <h1 className="section-title">{c.title}</h1>
      <p>{c.intro}</p>
      <Catalog products={products.filter((p) => p.category === c.name)} demo={demo} />
      <CategoryLinks products={products} />
    </section>
  );
}
