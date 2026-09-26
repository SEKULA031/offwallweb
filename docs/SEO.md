# OFFWALL — SEO održavanje

Glavna javna adresa je https://www.theoffwall.com. Canonical, Open Graph, sitemap i strukturirani podaci koriste ovu adresu. Relativni interni linkovi ostaju na www domenu; apex i stari offwallweb.vercel.app se trajno preusmeravaju uz očuvanje putanje.

## Šta je urađeno

- Postojeći serverski prikaz, Next Image, jezik sr-Latn, lokalni fontovi i zabrana indeksiranja korpe/checkouta su zadržani.
- Dinamičke kategorije samo za stvarno objavljene proizvode: sport, street-culture, lifestyle, arhitektura, filmovi-i-serije. Prazne/nepostojeće kategorije vraćaju 404.
- Jedinstvena metadata i canonical po stranici; Open Graph i Twitter prikaz. Hero slogan i vizuelni koncept su očuvani.
- Vidljivi breadcrumbs i BreadcrumbList; međusobni linkovi kolekcija i srodnih proizvoda.
- Organization za OFFWALL i potvrđeni Instagram. Bez pretpostavljene fizičke radnje ili lažnih recenzija.
- Product/Offer cene u RSD iz iste baze kao kupovina. Svaka ponuda vodi do odgovarajućeg izbora formata/rama. Ugašena prodavnica ne označava proizvode kao InStock. Probni katalog ne emituje Product schema i ima noindex.
- Sitemap prati objavljivanje novih radova, kategorije, stvarne datume izmene i slike. Nema korpe, admina, uslova/privatnosti u sitemapu. Uslovi i privatnost su dostupni kupcima uz noindex.
- Robots dopušta čitanje noindex stranica, da bi Google mogao da vidi te oznake. API je isključen. Preview objave dobijaju X-Robots-Tag noindex.
- SEO naslov/opis i alt slike uređuju se u adminu. Postojeća polja naziv, opis, slug, slike, cene i varijante ostaju. Prazni SEO unosi koriste sadržaj proizvoda.
- Istorija promenjenih slugova se čuva u bazi: stari link direktno preusmerava na najnoviji, bez lanca. Stari slug ne može preuzeti drugi proizvod; nacrti nisu javni.
- Novi upload slike dobija naziv sa slugom proizvoda. Postojeći URL-ovi slika sa UUID oznakama nisu brisani ni menjani kako se postojeće veze ne bi pokvarile; sada imaju sadržajan alt tekst.
- Viši prioritet glavnoj slici, tačne responsive veličine prema prelomu na 1000 px i request deduplikacija kataloga. Tekst na crvenom je beo radi kontrasta; crvena i raspored su sačuvani.

## Baza

002_seo.sql je dopuna postojeće baze, bez ponovnog pokretanja 001. Čuva cene, varijante, porudžbine i RLS. Primenjena 26.09.2026. na postojećem projektu. Testovi proveravaju rezervaciju starih slugova i nedostupnost istorije nacrta anonimnim posetiocima.

## GA4 — nije aktiviran

Vlasnik još nema GA4 ID. Na sajtu trenutno nema dodatog Google trackera ni novih analitičkih kolačića.

1. U svom Google nalogu otvori https://analytics.google.com i napravi GA4 property OFFWALL, vremenska zona Srbija/Beograd i valuta RSD.
2. Dodaj Web data stream za https://www.theoffwall.com i pošalji Measurement ID oblika G-XXXXXXXXXX. Nije potreban API ključ ili lozinka.
3. Pre uključivanja dopuniti obaveštenje o privatnosti stvarnim korišćenjem analitike i povezati odluku posetioca o analitičkim kolačićima. Ne stavljati tracker direktno u admin tekstove.
4. Implementirati jedan način merenja SPA page_view događaja, bez duplog automatskog i ručnog praćenja. Ne slati email, ime, adresu kupca ili sadržaj porudžbine u URL parametrima.
5. U Realtime/DebugView proveriti jednu početnu posetu i jedan prelazak na proizvod. Tek zatim dodati view_item, add_to_cart, begin_checkout i purchase sa sprečavanjem duplih purchase događaja; to nije deo trenutno aktivnog praćenja.
6. Povezati Search Console property sa GA4 kroz Admin > Product links > Search Console links kada isti Google nalog ima prava na oba.

## Search Console

Postojeći property i sitemap ne praviti ponovo. Proveriti prijavljeni https://www.theoffwall.com/sitemap.xml, zatim URL Inspection za početnu, /posteri, jednu kategoriju i jedan proizvod. Proveriti Google-selected canonical, user-declared canonical, indeksiranje i poslednji crawl. Live URL Test potvrđuje pristupačnost, ne potvrđuje da je URL već indeksiran. Zahtev za indeksiranje koristi razumno za ključne nove URL-ove; ostale Google otkriva kroz sitemap i interne linkove.

## Mesečno održavanje

- Prve 2–4 nedelje: proveriti Pages/Sitemaps, 404 i server greške, Product/Breadcrumb enhancement izveštaje. Ne menjati slugove radi kozmetike.
- Svakih 28 dana uporediti upite i stranice, filtrirati Srbiju, odvojiti mobilni prikaz i brendirane upite. Posmatrati klikove, impresije, CTR i prosečnu poziciju zajedno.
- Stranicama koje imaju impresije a slab CTR poboljšati naslov prema stvarnom motivu i nameri; ne menjati sve naslove odjednom.
- Dodavati originalne radove i fotografije, precizne opise materijala i dimenzija kada vlasnik dostavi podatke. Nove kategorije praviti tek kada postoji zasebna ponuda i koristan sadržaj.
- Pratiti Core Web Vitals sa stvarnim podacima kada Google prikupi dovoljan uzorak. Lighthouse TBT nije INP i pojedinačan laboratorijski rezultat nije 28-dnevni CWV status.

## Zvanične smernice

- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications
- https://support.google.com/analytics/answer/9304153
