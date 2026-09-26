'use client';
import Image from 'next/image';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveProduct,
  uploadImage,
  saveSettings,
  updateOrder,
  retryEmails,
} from '@/app/admin/actions';
import { demoProducts } from '@/lib/demo';
import { productSeo, SITE_URL } from '@/lib/seo';
import { money, type Product, type StoreSettings } from '@/lib/types';
type Order = {
  id: string;
  number: number;
  created_at: string;
  status: string;
  total: number;
  shipping: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    note: string;
  };
  order_items: {
    id: string;
    product_name: string;
    size: string;
    frame: string;
    quantity: number;
    unit_price: number;
  }[];
  email_outbox: { id: string; kind: string; status: string; attempts: number }[];
};
const statusLabels: Record<string, string> = {
  new: 'Nova',
  confirmed: 'Potvrđena',
  shipped: 'Poslata',
  completed: 'Završena',
  cancelled: 'Otkazana',
};
function blank(): Product {
  return {
    id: crypto.randomUUID(),
    name: '',
    slug: '',
    description: '',
    category: '',
    images: [],
    published: false,
    variants: [
      { id: crypto.randomUUID(), size: '30 × 40', frame: 'Bez rama', price: 0, active: true },
    ],
  };
}
export function AdminPanel({
  products,
  orders,
  settings,
}: {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
}) {
  const [tab, setTab] = useState('products');
  const [editor, setEditor] = useState<Product | null>(null);
  const editorRef = useRef<HTMLFormElement>(null);
  const editorId = editor?.id;
  useEffect(() => {
    if (!editorId || tab !== 'products') return;
    const form = editorRef.current;
    form?.scrollIntoView({ behavior: 'instant', block: 'start' });
    form?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
  }, [editorId, tab]);
  const [config, setConfig] = useState(settings);
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();
  function perform(fn: () => Promise<{ error?: string; ok?: boolean }>, success: string) {
    setMessage('');
    start(async () => {
      try {
        const result = await fn();
        setMessage(result.error || success);
        if (!result.error) router.refresh();
      } catch {
        setMessage('Veza je prekinuta. Pokušajte ponovo.');
      }
    });
  }
  return (
    <>
      <div className="controls">
        {[
          ['products', 'Proizvodi'],
          ['orders', `Porudžbine (${orders.length})`],
          ['settings', 'Podešavanja'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? 'button dark' : 'button'}
            onClick={() => {
              setTab(value);
              setMessage('');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {tab === 'products' && (
        <>
          <div className="controls">
            <button
              className="button primary"
              onClick={() => {
                setMessage('');
                setEditor(blank());
              }}
            >
              Dodaj proizvod +
            </button>
            {!products.length && (
              <button
                disabled={busy}
                className="button"
                onClick={() =>
                  perform(async () => {
                    for (const p of demoProducts) {
                      const result = await saveProduct({ ...p, published: false });
                      if (result.error) return result;
                    }
                    return { ok: true };
                  }, 'Šest nacrta je dodato. Proverite stvarne cene pre objave.')
                }
              >
                Uvezi Figma proizvode kao nacrte
              </button>
            )}
          </div>
          <div className="admin-products">
            {products.map((p) => (
              <article className="admin-product" key={p.id}>
                {p.images[0] && <Image src={p.images[0]} width={85} height={100} alt={p.name} />}
                <div>
                  <h3>{p.name}</h3>
                  <p className="caption">
                    {p.published ? '● Objavljen' : '○ Nacrt'} /{' '}
                    {p.variants.filter((v) => v.active).length} aktivnih varijanti
                  </p>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    setEditor(structuredClone(p));
                    setMessage('');
                    if (editor?.id === p.id) {
                      editorRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
                      editorRef.current
                        ?.querySelector<HTMLInputElement>('input')
                        ?.focus({ preventScroll: true });
                    }
                  }}
                >
                  Izmeni
                </button>
              </article>
            ))}
          </div>
          {editor && (
            <form
              ref={editorRef}
              aria-label={editor.name ? `Izmena proizvoda: ${editor.name}` : 'Novi proizvod'}
              className="editor stack"
              onSubmit={(e) => {
                e.preventDefault();
                perform(() => saveProduct(editor), 'Proizvod je sačuvan.');
              }}
            >
              <div className="admin-heading">
                <h2 className="small-heading">{editor.name || 'NOVI PROIZVOD'}</h2>
                <button type="button" className="button" onClick={() => setEditor(null)}>
                  Zatvori ×
                </button>
              </div>
              <div className="form-grid">
                {[
                  ['name', 'Naziv'],
                  ['slug', 'URL naziv (npr. jordan-chicago)'],
                  ['category', 'Kategorija'],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <input
                      required
                      value={String(editor[key as keyof Product])}
                      onChange={(e) => setEditor({ ...editor, [key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <label>
                Opis
                <textarea
                  required
                  rows={3}
                  value={editor.description}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                />
              </label>
              <fieldset className="stack small-gap">
                <legend>Prikaz u Google pretrazi</legend>
                <p className="caption muted">
                  Prazna polja koriste naziv i opis proizvoda. Promena URL naziva čuva preusmerenje
                  sa prethodne adrese.
                </p>
                <label>
                  SEO naslov
                  <input
                    maxLength={100}
                    value={editor.seo_title || ''}
                    placeholder={`${editor.name} — poster`}
                    onChange={(e) => setEditor({ ...editor, seo_title: e.target.value })}
                  />
                </label>
                <label>
                  SEO opis
                  <textarea
                    maxLength={300}
                    rows={3}
                    value={editor.seo_description || ''}
                    placeholder="Kratko opiši konkretan motiv i šta kupac dobija."
                    onChange={(e) => setEditor({ ...editor, seo_description: e.target.value })}
                  />
                </label>
                <p className="caption">
                  Pregled: {productSeo(editor).title} | OFFWALL
                  <br />
                  {SITE_URL}/posteri/{editor.slug}
                  <br />
                  {productSeo(editor).description}
                </p>
              </fieldset>
              <div className="stack small-gap">
                <label>
                  Dodaj sliku (JPG, PNG ili WebP, do 8 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy || editor.images.length >= 8}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const data = new FormData();
                      data.set('image', file);
                      data.set('slug', editor.slug);
                      start(async () => {
                        try {
                          const result = await uploadImage(data);
                          if (result.url)
                            setEditor(
                              (current) =>
                                current && { ...current, images: [...current.images, result.url] },
                            );
                          else setMessage(result.error || 'Slika nije otpremljena.');
                        } catch {
                          setMessage('Otpremanje nije uspelo.');
                        }
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
                <div className="controls">
                  {editor.images.map((src, i) => (
                    <div className="image-edit" key={src}>
                      <Image src={src} alt={`Slika ${i + 1}`} width={100} height={120} />
                      <label>
                        Opis slike (alt)
                        <input
                          maxLength={300}
                          value={editor.image_alts?.[src] || ''}
                          placeholder={`${editor.name} — prikaz postera`}
                          onChange={(e) =>
                            setEditor({
                              ...editor,
                              image_alts: { ...editor.image_alts, [src]: e.target.value },
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditor({ ...editor, images: editor.images.filter((_, j) => i !== j) })
                        }
                      >
                        Ukloni {i === 0 ? 'naslovnu' : 'sliku'}
                      </button>
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditor({
                              ...editor,
                              images: [src, ...editor.images.filter((_, j) => i !== j)],
                            })
                          }
                        >
                          Postavi za naslovnu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <h3>Formati, ramovi i cene</h3>
              <p className="caption muted">
                Cene unesite u dinarima (RSD). Isključite varijantu da je uklonite iz prodaje.
              </p>
              {editor.variants.map((v, i) => (
                <div className="variant-row" key={v.id}>
                  {[
                    ['size', 'Format'],
                    ['frame', 'Ram'],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        required
                        value={String(v[key as 'size' | 'frame'])}
                        onChange={(e) =>
                          setEditor({
                            ...editor,
                            variants: editor.variants.map((x, j) =>
                              j === i ? { ...x, [key]: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Cena / RSD
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      step="0.01"
                      required
                      value={v.price / 100 || ''}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          variants: editor.variants.map((x, j) =>
                            j === i ? { ...x, price: Math.round(Number(e.target.value) * 100) } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={v.active}
                      onChange={(e) =>
                        setEditor({
                          ...editor,
                          variants: editor.variants.map((x, j) =>
                            j === i ? { ...x, active: e.target.checked } : x,
                          ),
                        })
                      }
                    />
                    Aktivna
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="button"
                onClick={() =>
                  setEditor({
                    ...editor,
                    variants: [
                      ...editor.variants,
                      { id: crypto.randomUUID(), size: '', frame: '', price: 0, active: true },
                    ],
                  })
                }
              >
                Dodaj varijantu +
              </button>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={editor.published}
                  onChange={(e) => setEditor({ ...editor, published: e.target.checked })}
                />
                Objavi proizvod u prodavnici
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? 'Čuvanje…' : 'Sačuvaj proizvod'}
              </button>
            </form>
          )}
        </>
      )}
      {tab === 'orders' && (
        <div className="stack">
          <p className="caption muted">
            Poslednjih 200 porudžbina. Sve porudžbine ostaju u Supabase bazi.
          </p>
          {!orders.length && <p>Još nema porudžbina.</p>}
          {orders.map((o) => (
            <details className="order-card" key={o.id}>
              <summary>
                #{o.number} / {o.customer.name} / {money(o.total)}{' '}
                <span>{statusLabels[o.status]}</span>
              </summary>
              <div className="stack">
                <p>{new Date(o.created_at).toLocaleString('sr-RS')} / Pouzećem</p>
                <p>
                  {o.customer.email} / {o.customer.phone}
                  <br />
                  {o.customer.address}, {o.customer.postalCode} {o.customer.city}
                </p>
                {o.customer.note && <p>Napomena: {o.customer.note}</p>}
                {o.order_items.map((i) => (
                  <p key={i.id}>
                    {i.product_name} / {i.size} / {i.frame} × {i.quantity} —{' '}
                    {money(i.unit_price * i.quantity)}
                  </p>
                ))}
                <p>Dostava: {money(o.shipping)}</p>
                <label>
                  Status porudžbine
                  <select
                    value={o.status}
                    disabled={busy}
                    onChange={(e) =>
                      perform(() => updateOrder(o.id, e.target.value), 'Status je ažuriran.')
                    }
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="caption">
                  Email:{' '}
                  {o.email_outbox
                    .map(
                      (j) =>
                        `${j.kind === 'customer' ? 'Kupac' : 'Prodavnica'} — ${j.status} (${j.attempts})`,
                    )
                    .join(' / ')}
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    perform(
                      () => retryEmails(o.id),
                      'Red emailova je obrađen. Proverite status slanja.',
                    )
                  }
                >
                  Ponovi neuspele emailove
                </button>
              </div>
            </details>
          ))}
        </div>
      )}
      {tab === 'settings' && (
        <form
          className="editor stack"
          onSubmit={(e) => {
            e.preventDefault();
            perform(() => saveSettings(config), 'Podešavanja su sačuvana.');
          }}
        >
          <h2 className="small-heading">PODACI I DOSTAVA</h2>
          <div className="form-grid">
            {[
              ['contact_email', 'Kontakt email'],
              ['business_name', 'Poslovno ime'],
              ['business_address', 'Adresa prodavca'],
              ['business_id', 'Matični broj / PIB'],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  type={key === 'contact_email' ? 'email' : 'text'}
                  value={String(config[key as keyof StoreSettings])}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                />
              </label>
            ))}
            <label>
              Dostava / RSD
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={config.shipping_price / 100}
                onChange={(e) =>
                  setConfig({ ...config, shipping_price: Math.round(Number(e.target.value) * 100) })
                }
              />
            </label>
            <label>
              Besplatna dostava od / RSD (prazno = isključeno)
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  config.free_shipping_threshold === null
                    ? ''
                    : config.free_shipping_threshold / 100
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    free_shipping_threshold:
                      e.target.value === '' ? null : Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </label>
          </div>
          {[
            ['delivery_text', 'Uslovi i rok dostave'],
            ['returns_text', 'Povrat i reklamacije'],
            ['privacy_text', 'Obaveštenje o privatnosti'],
            ['terms_text', 'Uslovi kupovine'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <textarea
                required
                minLength={20}
                rows={5}
                value={String(config[key as keyof StoreSettings])}
                onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.checkout_enabled}
              onChange={(e) => setConfig({ ...config, checkout_enabled: e.target.checked })}
            />
            Otvori prodavnicu za porudžbine pouzećem
          </label>
          <button className="button primary" disabled={busy}>
            Sačuvaj podešavanja
          </button>
        </form>
      )}
    </>
  );
}
