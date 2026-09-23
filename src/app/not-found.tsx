import Link from 'next/link';
export default function NotFound() {
  return (
    <section className="section stack">
      <p className="eyebrow accent">404 / PRAZAN ZID</p>
      <h1 className="section-title">Ovaj motiv nije tu.</h1>
      <Link className="button dark" href="/posteri">
        Pogledaj postere ↗
      </Link>
    </section>
  );
}
