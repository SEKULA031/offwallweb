'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './cart-provider';
import { money, type Product, type StoreSettings } from '@/lib/types';
export function CartPage({
  products,
  settings,
  demo,
}: {
  products: Product[];
  settings: StoreSettings;
  demo: boolean;
}) {
  const { items, setQuantity } = useCart();
  const resolved = items.map((item) => ({
    item,
    variant: products.flatMap((p) => p.variants).find((v) => v.id === item.variantId),
  }));
  const subtotal = resolved.reduce(
    (s, { item, variant }) => s + (variant?.price ?? 0) * item.quantity,
    0,
  );
  const shipping =
    settings.free_shipping_threshold !== null && subtotal >= settings.free_shipping_threshold
      ? 0
      : settings.shipping_price;
  if (!items.length)
    return (
      <div className="empty stack">
        <h2>Tvoj zid čeka.</h2>
        <p>Korpa je trenutno prazna. Pronađi motiv koji liči na tebe.</p>
        <Link className="button primary" href="/posteri">
          Istraži postere ↗
        </Link>
      </div>
    );
  return (
    <div className="checkout-grid">
      <div className="stack">
        {resolved.map(({ item, variant }) => (
          <article className="cart-row" key={item.variantId}>
            <Image src={item.image} alt={item.name} width={110} height={130} />
            <div className="stack small-gap">
              <h3>{item.name}</h3>
              <p className="caption muted">
                {item.size} / {item.frame}
              </p>
              <p>{variant ? money(variant.price) : 'Više nije dostupno'}</p>
              {variant && variant.price !== item.price && (
                <p className="caption accent">Cena je ažurirana.</p>
              )}
              <div className="controls">
                <label className="quantity">
                  Količina
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={item.quantity}
                    onChange={(e) => {
                      if (e.target.value) setQuantity(item.variantId, Number(e.target.value));
                    }}
                  />
                </label>
                <button className="text-link" onClick={() => setQuantity(item.variantId, 0)}>
                  Ukloni
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <aside className="order-summary stack">
        <h2 className="small-heading">TVOJ IZBOR.</h2>
        <div className="total-row">
          <span>Proizvodi</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="total-row">
          <span>Dostava</span>
          <span>{demo ? 'U pripremi' : money(shipping)}</span>
        </div>
        <div className="total-row grand-total">
          <span>Ukupno</span>
          <span>{money(subtotal + (demo ? 0 : shipping))}</span>
        </div>
        <p className="caption">Plaćanje pouzećem / Srbija</p>
        {!demo && settings.checkout_enabled && resolved.every((r) => r.variant) ? (
          <Link className="button primary full" href="/checkout">
            Nastavi na poručivanje ↗
          </Link>
        ) : (
          <p className="notice">
            {demo
              ? 'Pregled dizajna — probne cene. Naručivanje će biti dostupno kada prodavnica počne sa radom.'
              : !settings.checkout_enabled
                ? 'Prodavnica trenutno ne prima porudžbine.'
                : 'Ukloni nedostupne proizvode da nastaviš.'}
          </p>
        )}
        <Link className="text-link" href="/posteri">
          ← Nastavi kupovinu
        </Link>
      </aside>
    </div>
  );
}
