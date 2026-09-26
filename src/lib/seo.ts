import type { Metadata } from 'next';
import type { Product } from './types';

// A single public identity, independent of deployment/preview environment variables.
export const SITE_URL = 'https://www.theoffwall.com';
export const absoluteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString();
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image = '/offwall-logo.png',
  noindex = false,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: 'website',
      locale: 'sr_RS',
      siteName: 'OFFWALL',
      images: [{ url: absoluteUrl(image), alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl(image)] },
  };
}
export const homeSeo = {
  title: 'Dizajnirani posteri i ramovi za tvoj zid',
  description:
    'OFFWALL posteri inspirisani sportom, filmovima, patikama i arhitekturom. Izaberi motiv, dimenzije i ram ili nam pošalji ideju za poster po meri.',
};
export const catalogSeo = {
  title: 'Posteri za zid — kolekcija sa ramom i bez rama',
  description:
    'Pronađi poster za sobu: sport, filmovi i serije, street culture, lifestyle i arhitektura. Uporedi motive, dimenzije i cene dostupnih ramova.',
};
export const infoSeo: Record<string, { title: string; description: string }> = {
  dostava: {
    title: 'Dostava, povrat i reklamacije',
    description:
      'Informacije o dostavi OFFWALL postera, povratu i reklamacijama. Pročitaj uslove i preuzmi obrazac za odustanak od kupovine.',
  },
  kontakt: {
    title: 'Kontakt — pitanja i posteri po meri',
    description:
      'Kontaktiraj OFFWALL mejlom ili na Instagramu za pitanja o posterima, ramovima, porudžbini ili izradi postera prema tvojoj ideji.',
  },
  uslovi: {
    title: 'Uslovi kupovine',
    description:
      'Uslovi kupovine u OFFWALL prodavnici: naručivanje, plaćanje i prava kupaca. Pročitaj informacije pre poručivanja postera.',
  },
  privatnost: {
    title: 'Obaveštenje o privatnosti',
    description:
      'Pročitaj kako OFFWALL obrađuje podatke koje dostaviš prilikom poručivanja i kontaktiranja prodavnice.',
  },
};
export function productSeo(p: Product) {
  return {
    title: p.seo_title?.trim() || `${p.name} — poster`,
    description: p.seo_description?.trim() || excerpt(p.description),
  };
}
export function excerpt(text: string, length = 160) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length - 1).replace(/\s+\S*$/, '')}…`;
}
export function imageAlt(p: Product, src: string) {
  return p.image_alts?.[src]?.trim() || `${p.name} — prikaz postera`;
}
export function productStructuredData(p: Product, canOrder: boolean) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/posteri/${p.slug}`)}#product`,
    name: p.name,
    description: p.description,
    url: absoluteUrl(`/posteri/${p.slug}`),
    image: p.images.map(absoluteUrl),
    brand: { '@type': 'Brand', name: 'OFFWALL' },
    offers: p.variants
      .filter((v) => v.active)
      .map((v) => ({
        '@type': 'Offer',
        name: `${p.name} / ${v.size} cm / ${v.frame}`,
        sku: v.id,
        url: absoluteUrl(`/posteri/${p.slug}?varijanta=${v.id}`),
        priceCurrency: 'RSD',
        price: (v.price / 100).toFixed(2),
        ...(canOrder ? { availability: 'https://schema.org/InStock' } : {}),
        seller: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'OFFWALL' },
      })),
  };
}
