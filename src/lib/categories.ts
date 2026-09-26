import type { Product } from './types';
const known: Record<string, { slug: string; title: string; intro: string }> = {
  SPORT: {
    slug: 'sport',
    title: 'Sportski posteri',
    intro:
      'Fudbal i košarka kroz portrete igrača, proslave i trenutke sa terena. Izaberi rad posvećen svom omiljenom sportisti, pa proveri dostupne dimenzije i ramove.',
  },
  'STREET CULTURE': {
    slug: 'street-culture',
    title: 'Street culture posteri',
    intro:
      'Patike i ulična kultura kao motiv za tvoj zid. Pogledaj grafike inspirisane sneaker kulturom i odaberi format koji odgovara tvojoj sobi.',
  },
  LIFESTYLE: {
    slug: 'lifestyle',
    title: 'Lifestyle posteri',
    intro:
      'Motivi iz svakodnevnih rituala, pretočeni u grafike za zid. Pogledaj aktuelne radove i izaberi poster za svoj kutak, uz ram ili bez njega.',
  },
  ARHITEKTURA: {
    slug: 'arhitektura',
    title: 'Posteri arhitekture',
    intro:
      'Zgrade, geometrija i izražajne forme kao tema postera. U ovoj kolekciji pronađi radove inspirisane arhitekturom i proveri kako izgledaju u različitim formatima.',
  },
  'FILM/SERIJA': {
    slug: 'filmovi-i-serije',
    title: 'Posteri filmova i serija',
    intro:
      'Likovi, scene i atmosfera filmova i serija koje pamtiš. Pogledaj naše interpretacije filmskih motiva i odaberi rad za svoj zid.',
  },
};
export function categorySlug(name: string) {
  return (
    known[name.toUpperCase()]?.slug ||
    name
      .toLowerCase()
      .replace(/đ/g, 'dj')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `kolekcija-${encodeURIComponent(name)}`
  );
}
export function categories(products: Product[]) {
  return [...new Set(products.map((p) => p.category))].map((name) => ({
    name,
    ...(known[name.toUpperCase()] || {
      slug: categorySlug(name),
      title: `${name} — posteri`,
      intro: `Pogledaj postere iz kolekcije ${name}. Na stranici svakog rada pronaći ćeš opis motiva, dostupne dimenzije, ramove i cene.`,
    }),
  }));
}
export const categoryPath = (name: string) => `/posteri/kategorija/${categorySlug(name)}`;
