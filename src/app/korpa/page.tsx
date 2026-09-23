import { getCatalog } from '@/lib/catalog';
import { CartPage } from '@/components/cart-page';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Korpa', robots: { index: false } };
export default async function Cart() {
  const data = await getCatalog();
  return (
    <section className="section stack">
      <p className="eyebrow accent">OFFWALL / KORPA</p>
      <h1 className="section-title">JEDAN KORAK DO TVOG ZIDA.</h1>
      <CartPage {...data} />
    </section>
  );
}
