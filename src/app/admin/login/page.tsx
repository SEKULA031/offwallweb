import { LoginForm } from '@/components/admin-login';
export const metadata = { title: 'Admin prijava', robots: { index: false, follow: false } };
export default function Login() {
  return (
    <section className="section login stack">
      <p className="eyebrow accent">OFFWALL / ADMIN</p>
      <h1 className="section-title">DOBRO DOŠAO.</h1>
      <LoginForm />
    </section>
  );
}
