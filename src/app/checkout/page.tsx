import { getCatalog } from '@/lib/catalog';
import { CheckoutForm } from '@/components/checkout-form';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Poručivanje', robots: { index: false } };
export default async function Checkout() {
  const { products, settings, demo } = await getCatalog();
  return (
    <section className="section stack">
      <p className="eyebrow accent">OFFWALL / PORUČIVANJE</p>
      <h1 className="section-title">USKORO NA TVOM ZIDU.</h1>
      {!demo && settings.checkout_enabled ? (
        <CheckoutForm products={products} settings={settings} />
      ) : (
        <p className="notice">Prodavnica još ne prima porudžbine.</p>
      )}
    </section>
  );
}
