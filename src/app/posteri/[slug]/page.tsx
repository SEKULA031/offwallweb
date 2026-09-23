import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';
import { ProductDetail } from '@/components/product-detail';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((p) => p.slug === slug);
  return { title: p?.name ?? 'Poster', description: p?.description };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, demo } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return (
    <section className="section stack">
      <Link className="text-link" href="/posteri">
        ← Svi posteri
      </Link>
      <ProductDetail product={product} demo={demo} />
    </section>
  );
}
