import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export default async function Info({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const { settings: s } = await getCatalog();
  const pages: Record<string, [string, string]> = {
    dostava: ['Dostava i povrat', [s.delivery_text, s.returns_text].filter(Boolean).join('\n\n')],
    privatnost: ['Privatnost', s.privacy_text],
    uslovi: ['Uslovi kupovine', s.terms_text],
    kontakt: [
      'Kontakt',
      [s.business_name, s.business_address, s.business_id, s.contact_email]
        .filter(Boolean)
        .join('\n'),
    ],
  };
  const info = pages[page];
  if (!info) notFound();
  return (
    <section className="section stack info">
      <p className="eyebrow accent">OFFWALL / INFORMACIJE</p>
      <h1 className="section-title">{info[0]}</h1>
      <div className="prose">
        {info[1] || 'Informacije su u pripremi. Prodavnica još ne prima porudžbine.'}
      </div>
      {page === 'kontakt' && (
        <a className="button dark" href="https://www.instagram.com/offwall.rs/">
          Instagram / @offwall.rs ↗
        </a>
      )}
    </section>
  );
}
