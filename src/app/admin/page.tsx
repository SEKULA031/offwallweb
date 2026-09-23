import { redirect } from 'next/navigation';
import { configured, requireAdmin } from '@/lib/supabase';
import { AdminPanel } from '@/components/admin-panel';
import { logout } from './actions';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administracija', robots: { index: false, follow: false } };
export default async function Admin() {
  if (!configured())
    return (
      <section className="section stack">
        <h1 className="section-title">ADMIN JE SPREMAN ZA POVEZIVANJE.</h1>
        <p>
          Dodajte Supabase podešavanja, pokrenite SQL migraciju i dodelite administratorski pristup.
          Uputstvo je u README fajlu projekta.
        </p>
      </section>
    );
  const db = await requireAdmin().catch(() => null);
  if (!db) redirect('/admin/login');
  const [products, orders, settings] = await Promise.all([
    db.from('products').select('*,variants(*)').order('created_at'),
    db
      .from('orders')
      .select('*,order_items(*),email_outbox(*)')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('store_settings').select('*').single(),
  ]);
  if (products.error || orders.error || settings.error) throw new Error('Admin data unavailable');
  return (
    <section className="section stack">
      <div className="admin-heading">
        <div>
          <p className="eyebrow accent">OFFWALL / STUDIO</p>
          <h1 className="section-title">TVOJA PRODAVNICA.</h1>
        </div>
        <form action={logout}>
          <button className="button">Odjavi se</button>
        </form>
      </div>
      <AdminPanel products={products.data} orders={orders.data} settings={settings.data} />
    </section>
  );
}
