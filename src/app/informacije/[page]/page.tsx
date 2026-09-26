import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/catalog';
import { infoSeo, pageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/breadcrumbs';
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const seo = infoSeo[page];
  if (!seo) notFound();
  return pageMetadata(
    seo.title,
    seo.description,
    `/informacije/${page}`,
    undefined,
    page === 'privatnost' || page === 'uslovi',
  );
}
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
      <Breadcrumbs
        items={[
          { name: 'Početna', href: '/' },
          { name: info[0], href: `/informacije/${page}` },
        ]}
      />
      <p className="eyebrow accent">OFFWALL / INFORMACIJE</p>
      <h1 className="section-title">{info[0]}</h1>
      <div className="prose">
        {info[1] || 'Informacije su u pripremi. Prodavnica još ne prima porudžbine.'}
      </div>
      {page === 'dostava' && (
        <div className="stack small-gap">
          <h2 className="small-heading">Obrazac za odustanak</h2>
          <p>
            Preuzmi PDF, popuni ga i pošalji na kontakt mejl prodavnice. Obrazac možeš popuniti u
            PDF čitaču ili odštampati. Odustanak možeš izjaviti i jasnom izjavom mejlom.
          </p>
          <a className="button dark" href="/dokumenti/obrazac-za-odustanak.pdf" download>
            Preuzmi obrazac za odustanak (PDF)
          </a>
          {s.contact_email && (
            <a
              className="text-link"
              href={`mailto:${s.contact_email}?subject=Odustanak%20od%20kupovine`}
            >
              {s.contact_email}
            </a>
          )}
        </div>
      )}
      {page === 'kontakt' && (
        <div className="contact-actions">
          {s.contact_email && (
            <a className="button" href={`mailto:${s.contact_email}`}>
              Pošalji nam mejl
            </a>
          )}
          <a className="button dark" href="https://www.instagram.com/offwall.rs/">
            Instagram / @offwall.rs
          </a>
        </div>
      )}
    </section>
  );
}
