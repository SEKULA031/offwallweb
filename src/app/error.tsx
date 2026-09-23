'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="section stack">
      <h1 className="section-title">Trenutak pauze.</h1>
      <p>Prodavnica je trenutno nedostupna. Pokušaj ponovo za nekoliko trenutaka.</p>
      <button className="button dark" onClick={reset}>
        Pokušaj ponovo
      </button>
    </section>
  );
}
