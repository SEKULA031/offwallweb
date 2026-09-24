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
            Pronađi svoj poster
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
          Pogledaj celu kolekciju
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
          <div className="frame-options">
            {[
              [
                'Crni',
                'Jasna linija i izražen kontrast. Crni ram daje motivu dubinu i lepo povezuje tamne detalje u prostoru. Za fotografije, grafike i postere koje želiš da istakneš.',
              ],
              [
                'Beli',
                'Jednostavan i nenametljiv. Beli ram ostavlja motivu prostor da diše i lako se uklapa uz svetle zidove. Za miran, sveden izgled bez suvišnih detalja.',
              ],
              [
                'Drvo',
                'Topliji ton i karakter koji se primećuje izbliza. Završnica u drvetu povezuje poster sa nameštajem i prirodnim tonovima prostora. Za kutak u kom svaki detalj ima svoje mesto.',
              ],
            ].map(([name, description]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className="caption muted">Dostupne opcije i tačne cene proveri uz izabrani poster.</p>
          <Link className="button dark" href="/posteri">
            Izaberi poster i ram
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
          Fotografija sa putovanja, trenutak koji želiš da sačuvaš, poklon za nekog svog ili ideja
          koju još ne znaš kako da nacrtaš. Pošalji nam ono od čega želiš da krenemo, a mi ćemo ti
          pomoći da to pretvoriš u poster koji ima tvoju priču.
        </p>
        <div className="steps">
          <div>
            <h3>01 / Podeli ideju</h3>
            <p>
              Piši nam na Instagramu ili mejlom. Pošalji fotografiju, inspiraciju ili kratak opis
              onoga što zamišljaš.
            </p>
          </div>
          <div>
            <h3>02 / Dogovorimo detalje</h3>
            <p>
              Zajedno biramo smer dizajna, format i ram. Cenu i rok dogovaramo pre početka izrade.
            </p>
          </div>
          <div>
            <h3>03 / Pogledaj svoj poster</h3>
            <p>
              Dobijaš predlog na pregled. Nakon što usaglasimo izgled, pripremamo poster za štampu i
              tvoj zid.
            </p>
          </div>
        </div>
        <div className="contact-actions">
          <a
            className="button dark"
            href={
              settings.contact_email
                ? `mailto:${settings.contact_email}?subject=Poster%20po%20mojoj%20meri`
                : 'mailto:soggacreativelab@gmail.com?subject=Poster%20po%20mojoj%20meri'
            }
          >
            Pošalji ideju mejlom
          </a>
          <a className="button" href="https://www.instagram.com/offwall.rs/">
            Piši nam na Instagramu
          </a>
        </div>
        {settings.contact_email && (
          <a className="text-link" href={`mailto:${settings.contact_email}`}>
            {settings.contact_email}
          </a>
        )}
      </section>
      <section className="section ink stack" id="o-nama">
        <p className="eyebrow">04 / OVO JE OFFWALL</p>
        <h2>
          PETORO NAS.
          <br />
          TVOJA PRIČA NA ZIDU.
        </h2>
        <p className="lead">
          OFFWALL je naš prvi zajednički projekat. Nas petoro studenata, iz različitih oblasti
          dizajna, spojili smo znanje, ideje i različite poglede na to kako prostor može da izgleda.
        </p>
        <p className="lead">
          Kroz svaki poster učimo, gradimo iskustvo i stvaramo nešto iza čega zajedno stojimo.
          Želimo da ti pomognemo da ostaviš lični trag u prostoru koji zoveš svojim: kroz motiv koji
          voliš, uspomenu koju čuvaš ili ideju koju ćemo zajedno razviti.
        </p>
        <p className="lead">Od prve skice do rama, tvoju ideju pretvaramo u deo tvog prostora.</p>
        <a className="button primary" href="https://www.instagram.com/offwall.rs/">
          Upoznaj OFFWALL
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
            'Javi nam se preko kontakta i opiši problem. Fotografije mogu pomoći, ali fotografije i originalna ambalaža nisu uslov za reklamaciju. Detalji su na stranici Dostava i povrat.',
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
