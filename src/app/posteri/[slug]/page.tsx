import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getCatalog } from '@/lib/catalog';
import { configured } from '@/lib/supabase';
import { categoryPath, categories } from '@/lib/categories';
import { pageMetadata, productSeo, productStructuredData } from '@/lib/seo';
import { ProductDetail } from '@/components/product-detail';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { StructuredData } from '@/components/structured-data';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ varijanta?: string }> };
async function resolve(slug: string) {
  const data = await getCatalog();
  const product = data.products.find((p) => p.slug === slug);
  if (product) return { ...data, product };
  if (configured()) {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: old } = await db
      .from('product_slug_history')
      .select('product_id')
      .eq('slug', slug)
      .maybeSingle();
    const target = data.products.find((p) => p.id === old?.product_id);
    if (target) permanentRedirect(`/posteri/${target.slug}`);
  }
  notFound();
}
export async function generateMetadata({ params }: Props) {
  const { product, demo } = await resolve((await params).slug);
  const seo = productSeo(product);
  return pageMetadata(
    seo.title,
    seo.description,
    `/posteri/${product.slug}`,
    product.images[0],
    demo,
  );
}
export default async function ProductPage({ params, searchParams }: Props) {
  const { product, products, settings, demo } = await resolve((await params).slug);
  const selectedVariant = (await searchParams).varijanta;
  const category = categories(products).find((c) => c.name === product.category)!;
  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);
  return (
    <section className="section stack">
      <Breadcrumbs
        items={[
          { name: 'Početna', href: '/' },
          { name: 'Posteri', href: '/posteri' },
          { name: category.title, href: categoryPath(product.category) },
          { name: product.name, href: `/posteri/${product.slug}` },
        ]}
      />
      {!demo && <StructuredData data={productStructuredData(product, settings.checkout_enabled)} />}
      <ProductDetail
        product={product}
        demo={demo}
        canOrder={!demo && settings.checkout_enabled}
        initialVariant={selectedVariant}
      />
      <div className="category-links">
        <Link className="text-link" href="/informacije/dostava">
          Dostava, povrat i reklamacije
        </Link>
        <Link className="text-link" href="/informacije/uslovi">
          Uslovi kupovine
        </Link>
        <Link className="text-link" href="/informacije/kontakt">
          Pitanja o ovom posteru
        </Link>
      </div>
      {!!related.length && (
        <aside className="stack">
          <h2 className="small-heading">Još iz ove kolekcije</h2>
          <div className="category-links">
            {related.map((p) => (
              <Link className="text-link" key={p.id} href={`/posteri/${p.slug}`}>
                {p.name}
              </Link>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
}
