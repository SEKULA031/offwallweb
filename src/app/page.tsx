import Image from 'next/image';
import Link from 'next/link';
import { getCatalog } from '@/lib/catalog';
import { Catalog } from '@/components/catalog';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const { products, settings, demo } = await getCatalog();
  return (
    <>
      <section className="hero section ink">
        <div className="hero-message">
          <p className="eyebrow">POSTERI. RAMOVI. LIČNI PEČAT.</p>
          <h1>
            TVOJ ZID.
            <br />
            TVOJA
            <br className="desktop-break" /> PRAVILA.
          </h1>
          <p className="hero-description">
            Od onoga što voliš do prostora koji liči na tebe. Izaberi svoj poster. Mi mu dajemo
            okvir.
          </p>
          <Link className="button primary" href="/posteri">
            Pronađi svoj poster ↗
          </Link>
        </div>
        <figure>
          <div className="hero-art">
            <Image
              src="/artwork/jordan-chicago.png"
              alt="Jordan Chicago poster u OFFWALL ramu"
              fill
              priority
              sizes="(max-width: 1000px) 90vw, 45vw"
            />
          </div>
          <figcaption>
            01 / JORDAN CHICAGO <span>OFFWALL SELECTION</span>
          </figcaption>
        </figure>
      </section>
      <div className="statement">BEZ PRAZNIH ZIDOVA. / VAN OBIČNOG.</div>
      <section className="section stack" id="kolekcija">
        <p className="eyebrow accent">01 / ODABRANI POSTERI</p>
        <h2>
          PRONAĐI
          <br />
          SVOJ MOTIV.
        </h2>
        <Catalog products={products} demo={demo} compact />
        <Link className="button" href="/posteri">
          Pogledaj celu kolekciju ↗
        </Link>
      </section>
      <section className="section surface feature" id="ramovi">
        <div className="frame-art">
          <Image
            src="/artwork/negroni.png"
            alt="Negroni poster sa ramom — detalj završnice"
            fill
            sizes="(max-width: 900px) 90vw, 45vw"
          />
        </div>
        <div className="stack">
          <p className="eyebrow accent">02 / ZAVRŠNI DETALJ</p>
          <h2>
            DOBAR POSTER.
            <br />
            PRAVI OKVIR.
          </h2>
          <p>
            Sa ramom ili bez. Odaberi završnicu koja pristaje tvom prostoru i pusti da motiv govori.
          </p>
          <p className="caption muted">
            CRNI / BELI / PRIRODNI
            <br />
            Dostupne opcije i cene pronađi na stranici svakog postera.
          </p>
          <Link className="button dark" href="/posteri">
            Izaberi poster i ram ↗
          </Link>
        </div>
      </section>
      <section className="section red stack" id="po-meri">
        <p className="eyebrow">03 / PO TVOJOJ MERI</p>
        <h2>
          IDEJA JE TVOJA.
          <br />
          OSTALO JE NA NAMA.
        </h2>
        <p className="lead">
          Tvoja fotografija, omiljeni trenutak ili potpuno nova ideja. Zajedno pravimo poster koji
          postoji samo za tebe.
        </p>
        <div className="steps">
          <p>01 Podeli ideju</p>
          <p>02 Pogledaj predlog</p>
          <p>03 Odaberi format</p>
        </div>
        <a
          className="button dark"
          href={
            settings.contact_email
              ? `mailto:${settings.contact_email}?subject=Poster%20po%20mojoj%20meri`
              : 'https://www.instagram.com/offwall.rs/'
          }
        >
          Započni svoj poster ↗
        </a>
      </section>
      <section className="section ink stack" id="o-nama">
        <p className="eyebrow">04 / OVO JE OFFWALL</p>
        <h2>
          NIJE SAMO
          <br />
          DEKORACIJA.
        </h2>
        <p className="lead">
          To je utakmica koju pamtiš. Film koji znaš napamet. Par patika koji govori sve.
        </p>
        <p className="lead">
          OFFWALL dizajnira, izrađuje i uramljuje postere za prostore sa ličnim pečatom. Od prve
          ideje do mesta na tvom zidu.
        </p>
        <a className="button primary" href="https://www.instagram.com/offwall.rs/">
          Upoznaj OFFWALL ↗
        </a>
      </section>
      <section className="section stack">
        <p className="eyebrow accent">05 / DOBRO JE ZNATI</p>
        <h2>IMAŠ PITANJE?</h2>
        {[
          [
            'Kako biram format?',
            'Izmeri prostor na zidu i pogledaj vodič dimenzija na stranici postera. Dostupni formati prikazani su uz svaki proizvod.',
          ],
          [
            'Mogu li da naručim svoj dizajn?',
            'Da. Javi nam se preko kontakta ili Instagrama i podeli svoju ideju.',
          ],
          [
            'Da li poster dolazi sa ramom?',
            'Ti biraš. Na stranici proizvoda izaberi dostupan ram ili opciju Bez rama. Cena se menja prema izboru.',
          ],
          [
            'Koliko košta dostava?',
            settings.checkout_enabled
              ? 'Trošak dostave prikazan je u korpi i pre potvrde porudžbine.'
              : 'Cenovnik dostave biće objavljen pre početka prodaje.',
          ],
          [
            'Šta ako je pošiljka oštećena?',
            'Sačuvaj ambalažu i fotografiši oštećenje, pa nam se javi preko kontakta. Uslovi povrata dostupni su na stranici Dostava i povrat.',
          ],
        ].map(([q, a]) => (
          <details className="faq" key={q}>
            <summary>
              {q}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
