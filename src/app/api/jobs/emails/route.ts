import { timingSafeEqual } from 'node:crypto';
import { sendPendingEmails } from '@/lib/email';
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  const actual = request.headers.get('authorization') ?? '';
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return new Response('Unauthorized', { status: 401 });
  try {
    await sendPendingEmails();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
