'use client';
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { CartItem } from '@/lib/types';
const key = 'offwall-cart-v1';
let cache = '';
let snapshot: CartItem[] = [];
const empty: CartItem[] = [];
const listeners = new Set<() => void>();
function read() {
  let raw = '';
  try {
    raw = localStorage.getItem(key) ?? '';
  } catch {
    return snapshot;
  }
  if (raw === cache) return snapshot;
  cache = raw;
  try {
    const data = JSON.parse(raw);
    snapshot = Array.isArray(data)
      ? data
          .filter(
            (i) =>
              i &&
              typeof i.variantId === 'string' &&
              typeof i.name === 'string' &&
              typeof i.image === 'string' &&
              typeof i.size === 'string' &&
              typeof i.frame === 'string' &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 20 &&
              Number.isInteger(i.price) &&
              i.price > 0,
          )
          .slice(0, 30)
      : [];
  } catch {
    snapshot = [];
  }
  return snapshot;
}
function write(items: CartItem[]) {
  snapshot = items;
  cache = JSON.stringify(items);
  try {
    localStorage.setItem(key, cache);
  } catch {
    /* Current-tab cart stays usable without storage. */
  }
  listeners.forEach((f) => f());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
}
type Cart = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQuantity: (id: string, q: number) => void;
  clear: () => void;
};
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, read, () => empty);
  return (
    <Context.Provider
      value={{
        items,
        add: (item) => {
          const current = read();
          const exists = current.find((i) => i.variantId === item.variantId);
          write(
            exists
              ? current.map((i) =>
                  i.variantId === item.variantId
                    ? { ...item, quantity: Math.min(20, i.quantity + 1) }
                    : i,
                )
              : [...current, item].slice(0, 30),
          );
        },
        setQuantity: (id, q) =>
          write(
            read()
              .map((i) =>
                i.variantId === id ? { ...i, quantity: Math.max(0, Math.min(20, q)) } : i,
              )
              .filter((i) => i.quantity > 0),
          ),
        clear: () => write([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing cart provider');
  return value;
}
