import { getCatalog } from '@/lib/catalog';
import { Catalog } from '@/components/catalog';
import { CategoryLinks } from '@/components/category-links';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { catalogSeo, pageMetadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const { demo } = await getCatalog();
  return pageMetadata(catalogSeo.title, catalogSeo.description, '/posteri', undefined, demo);
}
export default async function Posters() {
  const { products, demo } = await getCatalog();
  return (
    <section className="section stack">
      <Breadcrumbs
        items={[
          { name: 'Početna', href: '/' },
          { name: 'Posteri', href: '/posteri' },
        ]}
      />
      <p className="eyebrow accent">OFFWALL / KOLEKCIJA</p>
      <h1 className="section-title">POSTERI ZA TVOJ ZID.</h1>
      <p>
        Od sporta i filma do patika i arhitekture. Pronađi motiv za svoju sobu, izaberi dimenzije i
        pogledaj kako se uklapa uz ram. Cena i dostupne opcije nalaze se na stranici svakog postera.
      </p>
      <CategoryLinks products={products} />
      <Catalog products={products} demo={demo} />
    </section>
  );
}
