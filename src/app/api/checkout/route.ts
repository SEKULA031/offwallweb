import { createHash, createHmac } from 'node:crypto';
import { after, NextResponse } from 'next/server';
import { checkoutSchema } from '@/lib/validation';
import { configured, serviceClient } from '@/lib/supabase';
import { sendPendingEmails } from '@/lib/email';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const respond = (error: string, status: number) => NextResponse.json({ error }, { status });
  if (
    !configured() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.RATE_LIMIT_SECRET ||
    !process.env.RESEND_API_KEY ||
    !process.env.RESEND_FROM ||
    !process.env.ORDER_NOTIFICATION_EMAIL
  )
    return respond('Prodavnica još ne prima porudžbine.', 503);
  const origin = request.headers.get('origin');
  if (
    !process.env.NEXT_PUBLIC_SITE_URL ||
    origin !== new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
  )
    return respond('Zahtev nije dozvoljen.', 403);
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return respond('Neispravan zahtev.', 415);
  const reader = request.body?.getReader();
  if (!reader) return respond('Neispravan zahtev.', 400);
  let body = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 20000) {
      await reader.cancel();
      return respond('Zahtev je prevelik.', 413);
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    return respond('Neispravan zahtev.', 400);
  }
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) return respond('Proverite podatke i sadržaj korpe.', 400);
  const payload = parsed.data;
  if (new Set(payload.items.map((i) => i.variantId)).size !== payload.items.length)
    return respond('Korpa sadrži duplirane stavke.', 400);
  try {
    const db = serviceClient();
    // On Vercel this header is set by the platform. Self-hosts must sanitize it at the ingress.
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    for (const [identity, limit] of [
      [ip, 20],
      [payload.customer.email.toLowerCase(), 5],
    ] as const) {
      const key = createHmac('sha256', process.env.RATE_LIMIT_SECRET)
        .update(identity)
        .digest('hex');
      const { data: allowed, error } = await db.rpc('consume_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window: 600,
      });
      if (error) return respond('Pokušajte kasnije.', 503);
      if (!allowed) return respond('Previše pokušaja. Pokušajte za deset minuta.', 429);
    }
    const normalized = {
      expectedTotal: payload.expectedTotal,
      customer: { ...payload.customer, email: payload.customer.email.toLowerCase() },
      items: [...payload.items].sort((a, b) => a.variantId.localeCompare(b.variantId)),
    };
    const hash = createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
    const { data: order, error } = await db.rpc('place_order', {
      p_request_id: payload.requestId,
      p_hash: hash,
      p_customer: normalized.customer,
      p_items: normalized.items,
      p_expected_total: normalized.expectedTotal,
    });
    if (error) {
      if (error.message.includes('STORE_CLOSED'))
        return respond('Prodavnica trenutno ne prima porudžbine.', 503);
      if (error.message.includes('IDEMPOTENCY_CONFLICT'))
        return respond('Ovaj pokušaj je već obrađen sa drugim podacima. Osvežite stranicu.', 409);
      if (error.message.includes('PRICE_CHANGED'))
        return respond(
          'Cena ili dostava je promenjena. Vrati se u korpu i proveri novi iznos.',
          409,
        );
      if (/UNAVAILABLE_PRODUCT|INVALID_CART|ORDER_TOO_LARGE/.test(error.message))
        return respond(
          'Neki proizvodi više nisu dostupni ili je porudžbina prevelika. Proverite korpu.',
          409,
        );
      return respond('Porudžbina nije potvrđena. Pokušajte ponovo.', 503);
    }
    after(async () => {
      try {
        await sendPendingEmails(order.id);
      } catch {
        console.error('Email queue processing failed; order persisted.');
      }
    });
    return NextResponse.json(
      { number: order.number, total: order.total },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return respond('Veza sa prodavnicom nije dostupna. Pokušajte ponovo.', 503);
  }
}
