'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { money, type Product } from '@/lib/types';
import { useCart } from './cart-provider';
import { imageAlt } from '@/lib/seo';
import { categoryPath } from '@/lib/categories';
export function ProductDetail({
  product,
  demo,
  canOrder = false,
  initialVariant,
}: {
  product: Product;
  demo: boolean;
  canOrder?: boolean;
  initialVariant?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(
    product.variants.find((v) => v.id === initialVariant)?.id ?? product.variants[0]?.id,
  );
  const [image, setImage] = useState(0);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const variant = product.variants.find((v) => v.id === selected);
  return (
    <div className="detail-grid">
      <div>
        <div className="detail-art">
          <Image
            src={product.images[image]}
            alt={imageAlt(product, product.images[image])}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 1000px) 90vw, 48vw"
          />
        </div>
        {product.images.length > 1 && (
          <div className="controls">
            {product.images.map((src, i) => (
              <button
                className="thumbnail"
                aria-label={`Slika ${i + 1}`}
                aria-pressed={image === i}
                key={src}
                onClick={() => setImage(i)}
              >
                <Image src={src} alt={imageAlt(product, src)} width={70} height={80} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="stack">
        <Link className="eyebrow" href={categoryPath(product.category)}>
          {product.category}
        </Link>
        <h1 className="product-title">{product.name}</h1>
        <p>{product.description}</p>
        <p className="price">{variant ? money(variant.price) : 'Trenutno nedostupno'}</p>
        {demo && <p className="caption muted">Probne cene — pregled dizajna.</p>}
        {!demo && (
          <p className="caption muted">
            {canOrder && variant
              ? 'Dostupno za poručivanje.'
              : 'Poručivanje trenutno nije dostupno.'}
          </p>
        )}
        <fieldset>
          <legend>Format / cm</legend>
          <div className="options">
            {[...new Set(product.variants.map((v) => v.size))].map((size) => (
              <button
                key={size}
                className={variant?.size === size ? 'button dark' : 'button'}
                aria-pressed={variant?.size === size}
                onClick={() => {
                  setSelected(
                    (
                      product.variants.find((v) => v.size === size && v.frame === variant?.frame) ??
                      product.variants.find((v) => v.size === size)
                    )?.id,
                  );
                  setAdded(false);
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Ram</legend>
          <div className="options">
            {[...new Set(product.variants.map((v) => v.frame))].map((frame) => {
              const option = product.variants.find(
                (v) => v.size === variant?.size && v.frame === frame,
              );
              return (
                <button
                  key={frame}
                  disabled={!option}
                  className={variant?.frame === frame ? 'button dark' : 'button'}
                  aria-pressed={variant?.frame === frame}
                  onClick={() => {
                    setSelected(option?.id);
                    setAdded(false);
                  }}
                >
                  {frame}
                </button>
              );
            })}
          </div>
        </fieldset>
        <button
          className="button primary full"
          disabled={!variant}
          onClick={() => {
            if (variant) {
              add({
                variantId: variant.id,
                productId: product.id,
                name: product.name,
                image: product.images[0],
                size: variant.size,
                frame: variant.frame,
                price: variant.price,
                quantity: 1,
              });
              setAdded(true);
            }
          }}
        >
          {added ? 'Dodato u korpu' : 'Dodaj u korpu'}
        </button>
        <div aria-live="polite">
          {added && (
            <Link className="text-link" href="/korpa">
              Pogledaj korpu i nastavi
            </Link>
          )}
        </div>
        <details>
          <summary>Vodič za dimenzije</summary>
          <p>
            21 × 30 cm za manji kutak; 30 × 40 cm za galerijski zid; 50 × 70 cm za veliki motiv.
            Izmeri prostor pre izbora.
          </p>
        </details>
        <p className="caption muted">Plaćanje pouzećem. Dostava na teritoriji Srbije.</p>
      </div>
    </div>
  );
}
