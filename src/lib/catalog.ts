import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { configured } from './supabase';
import { defaultSettings, demoProducts } from './demo';
import type { Product, StoreSettings } from './types';
export async function getCatalog(): Promise<{
  products: Product[];
  settings: StoreSettings;
  demo: boolean;
}> {
  if (!configured()) return { products: demoProducts, settings: defaultSettings, demo: true };
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const [products, settings] = await Promise.all([
    db.from('products').select('*, variants(*)').eq('published', true).order('created_at'),
    db.from('store_settings').select('*').eq('id', true).single(),
  ]);
  if (products.error || settings.error)
    throw new Error('Prodavnica je trenutno nedostupna. Pokušajte ponovo.');
  return {
    products: (products.data as Product[]).map((p) => ({
      ...p,
      variants: p.variants.filter((v) => v.active),
    })),
    settings: settings.data,
    demo: false,
  };
}
