'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { configured, requireAdmin, sessionClient, serviceClient } from '@/lib/supabase';
import { productSchema, settingsSchema } from '@/lib/validation';
import { sendPendingEmails } from '@/lib/email';
import { Resend } from 'resend';
import { orderAttachments, orderMessage, type EmailOrder } from '@/lib/order-message';

export async function testEmail() {
  try {
    const db = await requireAdmin();
    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const to = process.env.ORDER_NOTIFICATION_EMAIL;
    if (!key || !from || !to)
      return {
        message:
          'Nedostaju Resend podešavanja u Vercelu. Proveri RESEND_API_KEY, RESEND_FROM i ORDER_NOTIFICATION_EMAIL, pa ponovi objavu.',
      };
    const { data: settings } = await db.from('store_settings').select('*').single();
    if (!settings?.contact_email)
      return { message: 'Unesi kontakt mejl u podešavanja prodavnice.' };
    const preview: EmailOrder = {
      number: 0,
      created_at: new Date().toISOString(),
      shipping: settings.shipping_price,
      total: 149000 + settings.shipping_price,
      customer: {
        name: 'PROBNI KUPAC',
        address: 'Primer adrese 1',
        postalCode: '11000',
        city: 'Beograd',
        email: to,
        phone: 'Primer telefona',
        note: 'TEST — nije stvarna porudžbina.',
      },
      order_items: [
        {
          product_name: 'Primer OFFWALL postera',
          size: '30 × 40',
          frame: 'Bez rama',
          quantity: 1,
          unit_price: 149000,
        },
      ],
      policy_snapshot: {
        delivery: settings.delivery_text,
        returns: settings.returns_text,
        terms: settings.terms_text,
        privacy: settings.privacy_text,
      },
    };
    const message = orderMessage(preview, settings.contact_email, false, true);
    const { error } = await new Resend(key).emails.send(
      {
        from,
        to,
        subject: 'OFFWALL — probni email',
        ...message,
        replyTo: settings.contact_email,
        attachments: await orderAttachments(preview, settings.contact_email),
      },
      { idempotencyKey: `offwall-admin-preview-${crypto.randomUUID()}` },
    );
    if (error)
      return {
        message:
          error.name === 'validation_error'
            ? 'Resend je odbio poruku. Proveri adresu pošiljaoca i primaoca. Sa resend.dev adrese možeš slati samo na email kojim je napravljen Resend nalog. Detalji su u Resend panelu.'
            : 'Slanje nije uspelo. Proveri Resend ključ, dozvolu za slanje i podešavanja domena u Resend panelu.',
      };
    return {
      message: `Resend je prihvatio probnu poruku za ${to}. Proveri prijemno sanduče, Spam i dva PDF priloga. Ovo nije stvarna porudžbina.`,
    };
  } catch {
    return {
      message: 'Provera nije uspela. Proveri administratorsku prijavu i vezu sa servisima.',
    };
  }
}
export async function login(_previous: { error: string }, form: FormData) {
  if (!configured()) return { error: 'Povežite Supabase pre prijave.' };
  const db = await sessionClient();
  const { error } = await db.auth.signInWithPassword({
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
  });
  if (error) return { error: 'Prijava nije uspela. Proverite email i lozinku.' };
  try {
    await requireAdmin();
  } catch {
    await db.auth.signOut();
    return { error: 'Nalog nema administratorski pristup.' };
  }
  redirect('/admin');
}
export async function logout() {
  const db = await sessionClient();
  await db.auth.signOut();
  redirect('/admin/login');
}
export async function saveProduct(input: unknown) {
  try {
    const db = await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return { error: 'Proverite naziv, slug, slike i cene svih varijanti.' };
    const product = parsed.data;
    const allowed = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`;
    if (
      product.images.some(
        (src) => !src.startsWith(allowed) && !/^\/artwork\/[a-z0-9-]+\.png$/.test(src),
      )
    )
      return { error: 'Koristite slike iz OFFWALL skladišta.' };
    if (product.published && !product.variants.some((v) => v.active))
      return { error: 'Objavljen proizvod mora imati bar jednu aktivnu varijantu.' };
    const { error } = await db.rpc('save_product', { p_product: product });
    if (error)
      return {
        error: 'Proizvod nije sačuvan. Proverite jedinstven slug i kombinacije formata i rama.',
      };
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { error: 'Nije moguće sačuvati. Proverite prijavu i vezu sa bazom.' };
  }
}
export async function uploadImage(form: FormData) {
  try {
    const db = await requireAdmin();
    const file = form.get('image');
    if (!(file instanceof File) || file.size === 0 || file.size > 8 * 1024 * 1024)
      return { error: 'Izaberite sliku do 8 MB.' };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime =
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? 'image/jpeg'
        : bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
          ? 'image/png'
          : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
              String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
            ? 'image/webp'
            : null;
    if (!mime || file.type !== mime) return { error: 'Dozvoljeni formati: JPG, PNG, WebP.' };
    const imageName =
      String(form.get('slug') || 'poster')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 100) || 'poster';
    const path = `${imageName}-${crypto.randomUUID()}.${mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1]}`;
    const { error } = await db.storage
      .from('product-images')
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) return { error: 'Slika nije otpremljena.' };
    return { url: db.storage.from('product-images').getPublicUrl(path).data.publicUrl };
  } catch {
    return { error: 'Proverite prijavu i vezu sa skladištem.' };
  }
}
export async function saveSettings(input: unknown) {
  try {
    const db = await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success)
      return { error: 'Popunite sve podatke prodavnice, uslove i ispravne cene dostave.' };
    if (
      parsed.data.checkout_enabled &&
      (!process.env.RESEND_API_KEY ||
        !process.env.RESEND_FROM ||
        !process.env.ORDER_NOTIFICATION_EMAIL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY ||
        !process.env.RATE_LIMIT_SECRET ||
        !process.env.NEXT_PUBLIC_SITE_URL)
    )
      return { error: 'Pre otvaranja podesite sve server ključeve, Resend i URL sajta.' };
    const { error } = await db.from('store_settings').update(parsed.data).eq('id', true);
    if (error) return { error: 'Podešavanja nisu sačuvana.' };
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch {
    return { error: 'Proverite administratorsku prijavu.' };
  }
}
export async function updateOrder(id: string, status: string) {
  try {
    const db = await requireAdmin();
    if (!['new', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(status))
      return { error: 'Neispravan status.' };
    const { error } = await db.from('orders').update({ status }).eq('id', id);
    if (error) return { error: 'Status nije sačuvan.' };
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { error: 'Proverite prijavu.' };
  }
}
export async function retryEmails(id: string) {
  try {
    await requireAdmin();
    const db = serviceClient();
    await db
      .from('email_outbox')
      .update({ next_attempt_at: new Date().toISOString(), attempts: 0 })
      .eq('order_id', id)
      .eq('status', 'failed');
    await sendPendingEmails(id);
    revalidatePath('/admin');
    return { ok: true };
  } catch {
    return { error: 'Slanje nije uspelo. Proverite Resend konfiguraciju.' };
  }
}
