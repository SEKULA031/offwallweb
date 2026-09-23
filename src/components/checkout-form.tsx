'use client';
import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { useCart } from './cart-provider';
import { money, type Product, type StoreSettings } from '@/lib/types';
export function CheckoutForm({
  products,
  settings,
}: {
  products: Product[];
  settings: StoreSettings;
}) {
  const { items, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ number: number; total: number } | null>(null);
  const attempt = useRef<{ body: string; id: string } | null>(null);
  const variants = products.flatMap((p) => p.variants);
  const subtotal = items.reduce(
    (s, i) => s + (variants.find((v) => v.id === i.variantId)?.price ?? 0) * i.quantity,
    0,
  );
  const shipping =
    settings.free_shipping_threshold !== null && subtotal >= settings.free_shipping_threshold
      ? 0
      : settings.shipping_price;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const data = new FormData(e.currentTarget);
    const customer = Object.fromEntries(
      ['name', 'email', 'phone', 'address', 'city', 'postalCode', 'note'].map((k) => [
        k,
        String(data.get(k) ?? ''),
      ]),
    );
    const payload = {
      expectedTotal: subtotal + shipping,
      customer,
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      acceptedTerms: data.get('terms') === 'on',
      website: String(data.get('website') ?? ''),
    };
    const body = JSON.stringify(payload);
    if (attempt.current?.body !== body) {
      let previous;
      try {
        previous = JSON.parse(sessionStorage.getItem('offwall-checkout-attempt') ?? 'null');
      } catch {}
      attempt.current = previous?.body === body ? previous : { body, id: crypto.randomUUID() };
      try {
        sessionStorage.setItem('offwall-checkout-attempt', JSON.stringify(attempt.current));
      } catch {}
    }
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, requestId: attempt.current!.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Porudžbina nije potvrđena.');
      setSuccess(result);
      clear();
      try {
        sessionStorage.removeItem('offwall-checkout-attempt');
      } catch {}
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Veza je prekinuta. Pokušaj ponovo sa istim podacima.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="order-summary stack" role="status">
        <p className="eyebrow accent">PORUDŽBINA #{success.number}</p>
        <h2>TVOM ZIDU STIŽE NOVA PRIČA.</h2>
        <p>
          Porudžbina je sačuvana. Ukupno za plaćanje pouzećem:{' '}
          <strong>{money(success.total)}</strong>.
        </p>
        <p>Potvrda stiže emailom. Sačuvaj broj porudžbine za sva pitanja.</p>
        <Link className="button dark" href="/posteri">
          Nazad na postere ↗
        </Link>
      </div>
    );
  if (!items.length)
    return (
      <div className="stack">
        <p>Korpa je prazna.</p>
        <Link className="button dark" href="/posteri">
          Izaberi poster ↗
        </Link>
      </div>
    );
  if (items.some((i) => !variants.find((v) => v.id === i.variantId)))
    return (
      <p className="notice">
        Neki proizvodi nisu dostupni. <Link href="/korpa">Proveri korpu.</Link>
      </p>
    );
  return (
    <form onSubmit={submit} className="checkout-grid">
      <fieldset className="stack" disabled={busy}>
        <legend className="small-heading">PODACI ZA DOSTAVU</legend>
        <p>Bez naloga. Samo podaci potrebni da poster stigne do tebe.</p>
        <div className="form-grid">
          {[
            ['name', 'Ime i prezime', 'name', 'text', 100],
            ['email', 'Email', 'email', 'email', 254],
            ['phone', 'Telefon', 'tel', 'tel', 25],
            ['address', 'Ulica i broj', 'street-address', 'text', 200],
            ['city', 'Grad', 'address-level2', 'text', 100],
            ['postalCode', 'Poštanski broj', 'postal-code', 'text', 5],
          ].map(([name, label, auto, type, max]) => (
            <label key={String(name)}>
              {label}
              <input
                name={String(name)}
                type={String(type)}
                autoComplete={String(auto)}
                required
                maxLength={Number(max)}
                pattern={name === 'postalCode' ? '[0-9]{5}' : undefined}
              />
            </label>
          ))}
        </div>
        <label>
          Napomena (opciono)
          <textarea name="note" maxLength={500} rows={3} />
        </label>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <p className="caption">Zemlja isporuke: Srbija. Način plaćanja: pouzećem.</p>
        <label className="checkbox">
          <input type="checkbox" name="terms" required />
          <span>
            Prihvatam{' '}
            <Link className="text-link" href="/informacije/uslovi" target="_blank">
              uslove kupovine
            </Link>{' '}
            i potvrđujem da sam pročitao/la{' '}
            <Link className="text-link" href="/informacije/privatnost" target="_blank">
              obaveštenje o privatnosti
            </Link>
            .
          </span>
        </label>
      </fieldset>
      <aside className="order-summary stack">
        <h2 className="small-heading">PREGLED PORUDŽBINE</h2>
        {items.map((i) => (
          <div key={i.variantId} className="total-row">
            <span>
              {i.name} × {i.quantity}
              <small>
                {i.size} / {i.frame}
              </small>
            </span>
            <span>{money(variants.find((v) => v.id === i.variantId)!.price * i.quantity)}</span>
          </div>
        ))}
        <div className="total-row">
          <span>Dostava</span>
          <span>{money(shipping)}</span>
        </div>
        <div className="total-row grand-total">
          <span>Ukupno</span>
          <span>{money(subtotal + shipping)}</span>
        </div>
        <p className="caption prose">{settings.delivery_text}</p>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
        <button className="button primary full" type="submit" disabled={busy}>
          {busy ? 'Čuvamo porudžbinu…' : 'Naruči uz obavezu plaćanja ↗'}
        </button>
        <p className="caption muted">Plaćanje kuriru pri preuzimanju.</p>
      </aside>
    </form>
  );
}
