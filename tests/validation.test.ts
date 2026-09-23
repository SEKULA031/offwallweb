import { describe, expect, it } from 'vitest';
import { checkoutSchema, productSchema } from '../src/lib/validation';
import { demoProducts } from '../src/lib/demo';
const valid = {
  expectedTotal: 149000,
  requestId: '20000000-0000-4000-8000-000000000001',
  customer: {
    name: 'Test Kupac',
    email: 'test@example.com',
    phone: '+381601234567',
    address: 'Test ulica 12',
    city: 'Beograd',
    postalCode: '11000',
  },
  items: [{ variantId: demoProducts[0].variants[0].id, quantity: 1 }],
  acceptedTerms: true,
};
describe('Checkout boundary', () => {
  it('accepts a guest Serbian COD order', () =>
    expect(checkoutSchema.safeParse(valid).success).toBe(true));
  it.each([0, -1, 21, 1.5])('rejects quantity %s', (quantity) =>
    expect(
      checkoutSchema.safeParse({ ...valid, items: [{ ...valid.items[0], quantity }] }).success,
    ).toBe(false),
  );
  it('rejects client totals, missing consent, empty carts and bots', () => {
    for (const patch of [
      { total: 1 },
      { acceptedTerms: false },
      { items: [] },
      { website: 'spam' },
    ])
      expect(checkoutSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it('validates postal codes and email', () => {
    expect(
      checkoutSchema.safeParse({ ...valid, customer: { ...valid.customer, postalCode: 'abc' } })
        .success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, customer: { ...valid.customer, email: 'bad' } }).success,
    ).toBe(false);
  });
  it('validates seed products, rejects zero prices', () => {
    for (const p of demoProducts) expect(productSchema.safeParse(p).success).toBe(true);
    const p = structuredClone(demoProducts[0]);
    p.variants[0].price = 0;
    expect(productSchema.safeParse(p).success).toBe(false);
  });
});
