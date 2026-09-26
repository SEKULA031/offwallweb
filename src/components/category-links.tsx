import Link from 'next/link';
import { categories } from '@/lib/categories';
import type { Product } from '@/lib/types';
export function CategoryLinks({ products }: { products: Product[] }) {
  return (
    <nav aria-label="Kolekcije postera" className="category-links">
      {categories(products).map((c) => (
        <Link className="text-link" href={`/posteri/kategorija/${c.slug}`} key={c.slug}>
          {c.title}
        </Link>
      ))}
    </nav>
  );
}
