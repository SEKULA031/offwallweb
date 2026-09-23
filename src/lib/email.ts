import 'server-only';
import { Resend } from 'resend';
import { serviceClient } from './supabase';
import { money } from './types';
export async function sendPendingEmails(orderId?: string) {
  const db = serviceClient();
  const { data: jobs, error } = await db.rpc('claim_emails', { p_order_id: orderId ?? null });
  if (error) throw new Error('Email queue unavailable');
  for (const job of jobs ?? []) {
    try {
      if (
        !process.env.RESEND_API_KEY ||
        !process.env.RESEND_FROM ||
        !process.env.ORDER_NOTIFICATION_EMAIL
      )
        throw new Error('Email configuration missing');
      const { data: order, error: orderError } = await db
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', job.order_id)
        .single();
      if (orderError || !order) throw new Error('Order unavailable');
      const lines = order.order_items
        .map(
          (i: {
            product_name: string;
            size: string;
            frame: string;
            quantity: number;
            unit_price: number;
          }) =>
            `${i.product_name} / ${i.size} / ${i.frame} × ${i.quantity} — ${money(i.unit_price * i.quantity)}`,
        )
        .join('\n');
      const c = order.customer;
      const text = `OFFWALL — Porudžbina #${order.number}\n\n${job.kind === 'customer' ? 'Hvala! Primili smo tvoju porudžbinu.' : 'Nova porudžbina.'}\n\n${lines}\n\nDostava: ${money(order.shipping)}\nUkupno: ${money(order.total)}\nPlaćanje: pouzećem\n\n${c.name}\n${c.address}\n${c.postalCode} ${c.city}, Srbija\n${c.phone}\n${c.email}\n${c.note || ''}\n\nDostava:\n${order.policy_snapshot.delivery}\n\nPovrat:\n${order.policy_snapshot.returns}\n\nUslovi:\n${order.policy_snapshot.terms}`;
      const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send(
        {
          from: process.env.RESEND_FROM,
          to: job.kind === 'customer' ? c.email : process.env.ORDER_NOTIFICATION_EMAIL,
          subject: `OFFWALL | Porudžbina #${order.number}`,
          text,
        },
        { idempotencyKey: `offwall-${job.id}` },
      );
      if (sendError) throw new Error('Email provider rejected message');
      const { error: updateError } = await db
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null })
        .eq('id', job.id);
      if (updateError) throw new Error('Email state update failed');
    } catch {
      await db
        .from('email_outbox')
        .update({
          status: 'failed',
          last_error: 'Slanje nije potvrđeno. Proverite Resend i konfiguraciju.',
          next_attempt_at: new Date(
            Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts),
          ).toISOString(),
        })
        .eq('id', job.id);
    }
  }
}
