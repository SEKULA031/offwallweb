import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { writeFile } from 'node:fs/promises';
import {
  orderMessage,
  orderAttachments,
  deliverySummary,
  type EmailOrder,
} from '../src/lib/order-message';

const order: EmailOrder = {
  number: 123,
  created_at: '2026-09-25T10:00:00Z',
  shipping: 40000,
  total: 338000,
  customer: {
    name: 'Primer kupca',
    address: 'Primer ulice 12',
    postalCode: '11000',
    city: 'Beograd',
    email: 'kupac@example.com',
    phone: 'Primer telefona',
    note: 'Ovo je primer prikaza, ne stvarna porudžbina.',
  },
  order_items: [
    {
      product_name: 'Jordan Chicago',
      size: '30 × 40',
      frame: 'Crni',
      quantity: 2,
      unit_price: 149000,
    },
  ],
  policy_snapshot: {
    delivery:
      'Očekivani rok isporuke je 3–7 radnih dana od prijema porudžbine. Plaćanje se vrši pouzećem. Vikendi i državni praznici ne računaju se u navedeni rok.',
    returns:
      'Primer odeljka o povratu i reklamacijama. Čuvamo tekst koji je važio pri kupovini, uključujući slova č, ć, š, ž i đ. Ово је пример ћирилице.\n'.repeat(
        12,
      ),
    terms:
      'Primer uslova kupovine. Ovo je ilustrativni dokument za proveru izgleda, a ne pravni tekst prodavnice.\n'.repeat(
        12,
      ),
    privacy:
      'Primer obaveštenja o privatnosti. Podaci u ovom dokumentu su izmišljeni i služe samo za pregled izgleda.',
  },
};
describe('Order confirmations', () => {
  it('keeps the body short, shows quantity, totals and the saved delivery window', () => {
    const result = orderMessage(order, 'kontakt@example.com');
    expect(result.text).toContain('3–7 radnih dana');
    expect(result.text).toContain('2 ×');
    expect(result.text).not.toContain(order.policy_snapshot.returns);
    expect(result.html).toContain('Ukupno');
    expect(result.html).toContain('mailto:kontakt@example.com');
  });
  it('escapes untrusted customer and product values in HTML', () => {
    const unsafe = structuredClone(order);
    unsafe.customer.note = '<img src=x onerror=alert(1)>';
    unsafe.order_items[0].product_name = '<script>bad</script>';
    const { html } = orderMessage(unsafe, 'kontakt@example.com');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });
  it('does not invent a delivery estimate if the saved text has no day range', () => {
    expect(deliverySummary('Po dogovoru.')).toContain('priloženim');
  });
  it('creates paginated PDFs and preserves the interactive withdrawal form', async () => {
    const attachments = await orderAttachments(order, 'kontakt@example.com');
    const policies = await PDFDocument.load(attachments[0].content);
    expect(policies.getPageCount()).toBeGreaterThan(1);
    const withdrawal = await PDFDocument.load(attachments[1].content);
    expect(withdrawal.getForm().getFields()).toHaveLength(8);
    if (process.env.OFFWALL_PREVIEW === 'true') {
      await writeFile('../OFFWALL-primer-potvrde.pdf', attachments[0].content);
      await writeFile(
        '../OFFWALL-primer-potvrde.html',
        orderMessage(order, 'kontakt@example.com', false, true).html,
      );
    }
  });
});
