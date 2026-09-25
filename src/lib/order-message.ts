import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { money } from './types';

export type EmailOrder = {
  number: number;
  created_at: string;
  shipping: number;
  total: number;
  customer: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    email: string;
    phone: string;
    note?: string;
  };
  order_items: {
    product_name: string;
    size: string;
    frame: string;
    quantity: number;
    unit_price: number;
  }[];
  policy_snapshot: { delivery: string; returns: string; terms: string; privacy?: string };
};
const escape = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function deliverySummary(text: string) {
  const match = text.match(/\b\d+\s*[-–—]\s*\d+\s+radnih\s+dana\b/iu);
  return match
    ? `${match[0]} od prijema porudžbine.`
    : 'Detaljan rok isporuke naveden je u priloženim uslovima dostave.';
}

export function orderMessage(
  order: EmailOrder,
  contact: string,
  merchant = false,
  preview = false,
) {
  const c = order.customer;
  const title = preview
    ? 'Probni prikaz potvrde'
    : merchant
      ? 'Nova porudžbina'
      : 'Hvala na porudžbini.';
  const intro = preview
    ? 'Ovo je primer izgleda emaila. Nije napravljena stvarna porudžbina.'
    : merchant
      ? 'Porudžbina je sačuvana i spremna za obradu.'
      : 'Primili smo tvoju porudžbinu. U nastavku su svi detalji kupovine.';
  const lines = order.order_items
    .map(
      (i) =>
        `${i.product_name} / ${i.size} / ${i.frame}\n${i.quantity} × ${money(i.unit_price)} = ${money(i.quantity * i.unit_price)}`,
    )
    .join('\n\n');
  const text = `OFFWALL | Porudžbina #${order.number}\n${title}\n${intro}\n\n${lines}\n\nProizvodi: ${money(order.total - order.shipping)}\nDostava: ${money(order.shipping)}\nUkupno za plaćanje: ${money(order.total)}\nPlaćanje: pouzećem, pri preuzimanju.\n\nAdresa isporuke:\n${c.name}\n${c.address}\n${c.postalCode} ${c.city}, Srbija\n${c.phone}\n${c.email}\n${c.note ? `Napomena: ${c.note}\n` : ''}\nOčekivani rok: ${deliverySummary(order.policy_snapshot.delivery)}\n\nPitanja o porudžbini: ${contact}\n\nU PDF prilogu su kompletni uslovi dostave, povrata, kupovine i privatnosti sačuvani uz ovu porudžbinu. Priložen je i obrazac za odustanak. Ovo nije fiskalni račun.`;
  const rows = order.order_items
    .map(
      (i) =>
        `<tr><td style="padding:16px 0;border-bottom:1px solid #ded9d1"><strong>${escape(i.product_name)}</strong><br><span style="color:#625f59;font-size:13px">${escape(i.size)} / ${escape(i.frame)}<br>${i.quantity} × ${escape(money(i.unit_price))}</span></td><td style="padding:16px 0;text-align:right;vertical-align:top;border-bottom:1px solid #ded9d1;white-space:nowrap">${escape(money(i.quantity * i.unit_price))}</td></tr>`,
    )
    .join('');
  const html = `<!doctype html><html lang="sr-Latn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f1eb;color:#141414;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escape(title)} — OFFWALL #${order.number}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff"><tr><td style="background:#141414;padding:28px;color:#ffffff;font-size:26px;letter-spacing:1px">OFFWALL</td></tr><tr><td style="padding:28px"><p style="color:#b61d25;font-size:12px;letter-spacing:1px">PORUDŽBINA #${order.number}</p><h1 style="font-size:28px;line-height:1.2;margin:16px 0">${escape(title)}</h1><p style="line-height:1.6;color:#625f59">${escape(intro)}</p><table width="100%" cellspacing="0" cellpadding="0">${rows}</table><table role="presentation" width="100%" style="margin:20px 0;line-height:1.8"><tr><td>Proizvodi</td><td align="right">${escape(money(order.total - order.shipping))}</td></tr><tr><td>Dostava</td><td align="right">${escape(money(order.shipping))}</td></tr><tr style="font-size:19px;font-weight:bold"><td>Ukupno</td><td align="right">${escape(money(order.total))}</td></tr></table><p style="padding:14px;background:#f4f1eb;font-size:14px">Plaćanje pouzećem, pri preuzimanju.</p><h2 style="font-size:18px;margin-top:28px">Adresa isporuke</h2><p style="line-height:1.7">${escape(c.name)}<br>${escape(c.address)}<br>${escape(c.postalCode)} ${escape(c.city)}, Srbija<br>${escape(c.phone)}<br>${escape(c.email)}</p>${c.note ? `<p style="line-height:1.6;overflow-wrap:anywhere"><strong>Napomena:</strong> ${escape(c.note)}</p>` : ''}<h2 style="font-size:18px">Očekivani rok isporuke</h2><p style="line-height:1.6">${escape(deliverySummary(order.policy_snapshot.delivery))}</p><hr style="border:0;border-top:1px solid #ded9d1;margin:28px 0"><h2 style="font-size:18px">Sve informacije su u prilogu</h2><p style="font-size:14px;line-height:1.7;color:#625f59">Sačuvaj PDF sa uslovima koji su važili pri poručivanju. Tu su detalji dostave, povrata, kupovine i privatnosti. Dodali smo i obrazac za odustanak.</p><p style="font-size:14px;line-height:1.7">Pitanja? Piši nam na <a style="color:#b61d25" href="mailto:${escape(contact)}">${escape(contact)}</a> i navedi broj porudžbine.</p></td></tr><tr><td style="padding:20px 28px;background:#f4f1eb;color:#625f59;font-size:12px">OFFWALL / Tvoj zid. Tvoja pravila.<br>Ova potvrda nije fiskalni račun.</td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}

export async function orderPolicyPdf(order: EmailOrder, contact: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await readFile(path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf')),
    { subset: true },
  );
  doc.setTitle(`OFFWALL - Uslovi porudžbine ${order.number}`);
  doc.setCreationDate(new Date(order.created_at));
  doc.setModificationDate(new Date(order.created_at));
  let page = doc.addPage([595.28, 841.89]);
  let y = 740;
  const header = () => {
    page.drawText('OFFWALL', { x: 44, y: 795, size: 20, font });
    page.drawText(`Porudžbina #${order.number} / Uslovi kupovine`, {
      x: 44,
      y: 771,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  };
  header();
  const line = (text: string, size = 10) => {
    if (y < 60) {
      page = doc.addPage([595.28, 841.89]);
      y = 740;
      header();
    }
    page.drawText(text, { x: 44, y, size, font, lineHeight: 16 });
    y -= size + 6;
  };
  const paragraph = (text: string, size = 10) => {
    const clean = text
      .replace(/\r/g, '')
      .replace(/\t/g, '    ')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    for (const raw of clean.split('\n')) {
      let current = '';
      for (const char of raw) {
        if (font.widthOfTextAtSize(current + char, size) > 507) {
          const space = current.lastIndexOf(' ');
          if (space > 0) {
            line(current.slice(0, space), size);
            current = current.slice(space + 1) + char;
          } else {
            line(current, size);
            current = char;
          }
        } else current += char;
      }
      line(current, size);
    }
    y -= 8;
  };
  paragraph(`Potvrda porudžbine #${order.number}`, 17);
  paragraph(
    `Datum: ${new Date(order.created_at).toLocaleDateString('sr-RS', { timeZone: 'Europe/Belgrade' })}\nKontakt: ${contact}\nNačin plaćanja: pouzećem.\nUkupan iznos: ${money(order.total)}`,
  );
  paragraph(
    'Ovaj dokument sadrži tekstove sačuvane uz porudžbinu u trenutku kupovine. Naknadne izmene na sajtu ne menjaju ovu kopiju.',
  );
  for (const [title, body] of [
    ['Dostava', order.policy_snapshot.delivery],
    ['Povrat i reklamacije', order.policy_snapshot.returns],
    ['Uslovi kupovine', order.policy_snapshot.terms],
    ['Obaveštenje o privatnosti', order.policy_snapshot.privacy],
  ]) {
    if (!body) continue;
    if (y < 130) {
      page = doc.addPage([595.28, 841.89]);
      y = 740;
      header();
    }
    paragraph(title!, 15);
    paragraph(body);
  }
  doc
    .getPages()
    .forEach((p, i) =>
      p.drawText(`${i + 1} / ${doc.getPageCount()}`, { x: 510, y: 30, size: 9, font }),
    );
  return Buffer.from(await doc.save());
}

export async function orderAttachments(order: EmailOrder, contact: string) {
  return [
    {
      filename: `OFFWALL-uslovi-${order.number}.pdf`,
      content: await orderPolicyPdf(order, contact),
    },
    {
      filename: 'OFFWALL-obrazac-za-odustanak.pdf',
      content: await readFile(
        path.join(process.cwd(), 'public/dokumenti/obrazac-za-odustanak.pdf'),
      ),
    },
  ];
}
