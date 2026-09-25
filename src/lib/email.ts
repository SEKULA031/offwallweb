import 'server-only';
import { Resend } from 'resend';
import { serviceClient } from './supabase';
import { orderMessage, orderAttachments, type EmailOrder } from './order-message';
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
      const { data: settings } = await db.from('store_settings').select('contact_email').single();
      if (!settings?.contact_email) throw new Error('Store contact unavailable');
      const contact = settings.contact_email;
      const c = order.customer;
      const { text, html } = orderMessage(order as EmailOrder, contact, job.kind !== 'customer');
      const attachments = await orderAttachments(order as EmailOrder, contact);
      const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send(
        {
          from: process.env.RESEND_FROM,
          to: job.kind === 'customer' ? c.email : process.env.ORDER_NOTIFICATION_EMAIL,
          subject: `OFFWALL | Porudžbina #${order.number}`,
          text,
          html,
          attachments,
          replyTo: contact,
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
