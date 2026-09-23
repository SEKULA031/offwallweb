import { getCatalog } from '@/lib/catalog';
import { Catalog } from '@/components/catalog';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Posteri' };
export default async function Posters() {
  const { products, demo } = await getCatalog();
  return (
    <section className="section stack">
      <p className="eyebrow accent">OFFWALL / KOLEKCIJA</p>
      <h1 className="section-title">PRONAĐI SVOJ MOTIV.</h1>
      <Catalog products={products} demo={demo} />
    </section>
  );
}
