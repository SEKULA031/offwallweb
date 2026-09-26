export type Variant = { id: string; size: string; frame: string; price: number; active: boolean };
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  published: boolean;
  variants: Variant[];
  seo_title?: string;
  seo_description?: string;
  image_alts?: Record<string, string>;
  updated_at?: string;
};
export type CartItem = {
  variantId: string;
  productId: string;
  name: string;
  image: string;
  size: string;
  frame: string;
  price: number;
  quantity: number;
};
export type StoreSettings = {
  id: boolean;
  checkout_enabled: boolean;
  shipping_price: number;
  free_shipping_threshold: number | null;
  contact_email: string;
  business_name: string;
  business_address: string;
  business_id: string;
  delivery_text: string;
  returns_text: string;
  privacy_text: string;
  terms_text: string;
};
export const money = (minor: number) =>
  new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    maximumFractionDigits: 0,
  }).format(minor / 100);
