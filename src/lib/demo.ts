import type { Product, StoreSettings } from './types';
const names = [
  'Jordan Chicago',
  'Mohamed Salah',
  'Air Max Day',
  'Negroni',
  'Lamine Yamal',
  'Brutalism',
];
const slugs = [
  'jordan-chicago',
  'mohamed-salah',
  'air-max-day',
  'negroni',
  'lamine-yamal',
  'brutalism',
];
export const demoProducts: Product[] = names.map((name, i) => ({
  id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  name,
  slug: slugs[i],
  category: ['STREET CULTURE', 'SPORT', 'STREET CULTURE', 'LIFESTYLE', 'SPORT', 'ARHITEKTURA'][i],
  description:
    'Od onoga što voliš do prostora koji liči na tebe. Izaberi format i završnicu za svoj zid.',
  images: [`/artwork/${slugs[i]}.png`],
  published: true,
  variants: ['21 × 30', '30 × 40', '50 × 70'].flatMap((size, s) =>
    ['Bez rama', 'Crni', 'Beli', 'Drvo'].map((frame, f) => ({
      id: `10000000-0000-4000-8000-${String(i * 12 + s * 4 + f + 1).padStart(12, '0')}`,
      size,
      frame,
      price: [149000, 199000, 299000][s] + (f ? [100000, 140000, 200000][s] : 0),
      active: true,
    })),
  ),
}));
export const defaultSettings: StoreSettings = {
  id: true,
  checkout_enabled: false,
  shipping_price: 0,
  free_shipping_threshold: null,
  contact_email: '',
  business_name: '',
  business_address: '',
  business_id: '',
  delivery_text: '',
  returns_text: '',
  privacy_text: '',
  terms_text: '',
};
