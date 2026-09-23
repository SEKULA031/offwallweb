import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export const configured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (entries) => {
          try {
            entries.forEach(({ name, value, options }) => jar.set(name, value, options));
          } catch {
            /* Server component: proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
export function serviceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server configuration unavailable');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function requireAdmin() {
  if (!configured()) throw new Error('Administracija nije povezana sa bazom.');
  const db = await sessionClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error('Prijavite se kao administrator.');
  const { data } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) throw new Error('Nalog nema administratorski pristup.');
  return db;
}
