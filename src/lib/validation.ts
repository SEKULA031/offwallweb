import { z } from 'zod';
export const checkoutSchema = z
  .object({
    requestId: z.uuid(),
    expectedTotal: z.number().int().min(100).max(110000000),
    customer: z.object({
      name: z.string().trim().min(3).max(100),
      email: z.email().max(254),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{7,25}$/),
      address: z.string().trim().min(5).max(200),
      city: z.string().trim().min(2).max(100),
      postalCode: z.string().regex(/^\d{5}$/),
      note: z.string().trim().max(500).default(''),
    }),
    items: z
      .array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(20) }))
      .min(1)
      .max(30),
    acceptedTerms: z.literal(true),
    website: z.string().max(0).default(''),
  })
  .strict();
export const productSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(5).max(3000),
  images: z.array(z.string().max(2048)).min(1).max(8),
  published: z.boolean(),
  variants: z
    .array(
      z.object({
        id: z.uuid(),
        size: z.string().trim().min(1).max(40),
        frame: z.string().trim().min(1).max(40),
        price: z.number().int().min(100).max(100000000),
        active: z.boolean(),
      }),
    )
    .min(1)
    .max(40),
});
export const settingsSchema = z.object({
  checkout_enabled: z.boolean(),
  shipping_price: z.number().int().min(0).max(10000000),
  free_shipping_threshold: z.number().int().min(0).max(100000000).nullable(),
  contact_email: z.email(),
  business_name: z.string().trim().min(2).max(200),
  business_address: z.string().trim().min(5).max(300),
  business_id: z.string().trim().min(2).max(100),
  delivery_text: z.string().trim().min(20).max(10000),
  returns_text: z.string().trim().min(20).max(10000),
  privacy_text: z.string().trim().min(20).max(15000),
  terms_text: z.string().trim().min(20).max(15000),
});
