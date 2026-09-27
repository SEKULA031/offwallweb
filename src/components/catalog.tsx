'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { imageAlt } from '@/lib/seo';
import { money, type Product } from '@/lib/types';
export function Catalog({
  products,
  demo,
  compact = false,
}: {
  products: Product[];
  demo: boolean;
  compact?: boolean;
}) {
  const ProductHeading = compact ? 'h3' : 'h2';
  const [category, setCategory] = useState('Svi posteri');
  const [sort, setSort] = useState('default');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(!compact);
  const price = (p: Product) => Math.min(...p.variants.map((v) => v.price));
  const shown = products
    .filter(
      (p) =>
        p.variants.length &&
        (category === 'Svi posteri' || p.category === category) &&
        p.name.toLocaleLowerCase('sr').includes(query.toLocaleLowerCase('sr')),
    )
    .sort((a, b) =>
      sort === 'asc' ? price(a) - price(b) : sort === 'desc' ? price(b) - price(a) : 0,
    );
  return (
    <>
      <div className="controls catalog-controls">
        <button
          className={category === 'Svi posteri' ? 'button dark' : 'button'}
          onClick={() => {
            setCategory('Svi posteri');
            setQuery('');
          }}
        >
          Svi posteri
        </button>
        <button className="button" aria-expanded={filters} onClick={() => setFilters(!filters)}>
          Filteri {filters ? '−' : '+'}
        </button>
        <select
          aria-label="Sortiraj postere"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="default">Sortiraj ↓</option>
          <option value="asc">Cena: rastuće</option>
          <option value="desc">Cena: opadajuće</option>
        </select>
      </div>
      {filters && (
        <div className="filters" id="pretraga">
          <label>
            Pretraga
            <input
              type="search"
              placeholder="Pronađi svoj motiv…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Kategorija
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {['Svi posteri', ...new Set(products.map((p) => p.category))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="product-grid">
        {shown.slice(0, compact ? 6 : undefined).map((p) => (
          <article className="product-card" key={p.id}>
            <Link href={`/posteri/${p.slug}`} className="artwork">
              <Image
                src={p.images[0]}
                alt={imageAlt(p, p.images[0])}
                fill
                sizes="(max-width: 1000px) 45vw, 30vw"
              />
            </Link>
            <span className="caption muted">{p.category}</span>
            <ProductHeading className="product-card-title">
              <Link href={`/posteri/${p.slug}`}>{p.name}</Link>
            </ProductHeading>
            <p>
              od {money(price(p))}
              {demo ? '*' : ''}
            </p>
            <Link className="button" href={`/posteri/${p.slug}`}>
              Detalji
            </Link>
          </article>
        ))}
      </div>
      {!shown.length && <p className="empty">Nema postera za ovaj izbor. Probaj drugu pretragu.</p>}
      {demo && (
        <p className="caption muted">
          * Pregled dizajna. Cene su probne; naručivanje nije uključeno.
        </p>
      )}
    </>
  );
}
