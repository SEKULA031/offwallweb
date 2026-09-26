import { describe, it, expect } from 'vitest';
import { demoProducts } from '../src/lib/demo';
import { absoluteUrl, pageMetadata, productStructuredData, productSeo } from '../src/lib/seo';
import { categories, categorySlug } from '../src/lib/categories';
describe('Search data accuracy', () => {
  it('uses the www production identity even with a preview environment', () => {
    expect(absoluteUrl('/posteri')).toBe('https://www.theoffwall.com/posteri');
    expect(pageMetadata('Naslov', 'Opis', '/posteri').alternates?.canonical).toBe(
      'https://www.theoffwall.com/posteri',
    );
  });
  it('uses real variant prices in dinars, skips inactive offers, and does not invent reviews', () => {
    const p = structuredClone(demoProducts[0]);
    p.variants[0].price = 249000;
    p.variants[1].active = false;
    const schema = productStructuredData(p, true);
    expect(schema.offers[0].price).toBe('2490.00');
    expect(schema.offers.every((o) => o.priceCurrency === 'RSD')).toBe(true);
    expect(schema.offers.some((o) => o.sku === p.variants[1].id)).toBe(false);
    expect(schema).not.toHaveProperty('aggregateRating');
    expect(productStructuredData(p, false).offers[0]).not.toHaveProperty('availability');
  });
  it('honors editable SEO and only creates categories present in the catalog', () => {
    expect(
      productSeo({ ...demoProducts[0], seo_title: 'Moj naslov', seo_description: 'Moj opis' }),
    ).toEqual({ title: 'Moj naslov', description: 'Moj opis' });
    expect(categories([])).toEqual([]);
    expect(categorySlug('FILM/SERIJA')).toBe('filmovi-i-serije');
  });
});
