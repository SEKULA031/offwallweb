# OFFWALL

Next.js + TypeScript prodavnica prema OFFWALL Figma dizajnu: početna, katalog/pretraga/filteri, proizvod sa formatom i ramom, trajna korpa, guest checkout pouzećem za Srbiju, Supabase administracija i Resend potvrde.

## Pokretanje

Potrebni su Node.js 22+ i pnpm 10.30.3.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Otvorite http://localhost:3000. Bez podešenog Supabase projekta prikazuje se Figma kolekcija sa jasno označenim probnim cenama. Checkout je zatvoren. Nema lažnih porudžbina ni javnog demo administratora.

## Povezivanje Supabase projekta

1. Kreirajte Supabase projekat. U SQL Editor-u izvršite `supabase/migrations/001_store.sql` jednom. Migracija pravi tabele, transakcione funkcije, RLS dozvole i javni bucket `product-images` (JPG/PNG/WebP, do 8 MB).
2. Kopirajte `.env.example` u `.env.local`. Unesite Project URL, publishable key i server-only service role key. Service role ključ nikada ne staviti u promenljivu sa prefiksom `NEXT_PUBLIC_`.
3. U Supabase Authentication napravite administratorskog korisnika sa emailom i lozinkom. Isključite javne registracije ako nisu potrebne. U SQL Editor-u dodelite pristup tačnom korisniku:

```sql
insert into public.admins(user_id)
select id from auth.users where email = 'VAS_ADMIN_EMAIL';
```

4. U Authentication URL Configuration podesite Site URL na stvarni domen. Lokalno koristite http://localhost:3000.
5. Otvorite `/admin/login`. Prijava koristi Supabase Auth; svaka izmena ponovo proverava korisnika i admin članstvo na serveru. RLS je dodatna zaštita.
6. Izaberite „Uvezi Figma proizvode kao nacrte”, ili dodajte proizvod. Unesite stvarne cene za svaki format/ram. Postavite fotografije, izaberite naslovnu, pa označite „Objavi proizvod” i sačuvajte. Neaktivne varijante nisu dostupne kupcima. Isključivanje objave odmah uklanja proizvod iz kataloga.

Svi iznosi u bazi su celobrojne pare (RSD × 100). Admin prikazuje i prihvata dinare. Cene iz Figma prototipa nisu odobreni komercijalni cenovnik. Lokalni import zato pravi samo nacrte.

## Resend i checkout

1. U Resend-u verifikujte domen slanja i DNS zapise koje Resend prikaže.
2. Podesite `RESEND_API_KEY`, `RESEND_FROM` (npr. `OFFWALL <porudzbine@vas-domen.rs>`) i `ORDER_NOTIFICATION_EMAIL` (adresa prodavnice).
3. Podesite `NEXT_PUBLIC_SITE_URL` na tačan origin sajta, bez dodatnih putanja. Checkout proverava Origin da bi odbacio zahteve sa drugih sajtova.
4. Generišite zasebne tajne za `RATE_LIMIT_SECRET` i `CRON_SECRET` (najmanje 32 slučajna znaka). Nemojte ih slati u chat ni stavljati u Git.
5. U `/admin` → Podešavanja popunite poslovne podatke, stvarnu cenu dostave, opciono prag besplatne dostave, rokove, povrat, privatnost i uslove kupovine. Unesite odobrene tekstove koji odgovaraju poslovanju; projekat ne izmišlja poslovne ili pravne podatke.
6. Tek zatim uključite „Otvori prodavnicu za porudžbine pouzećem”. Uradite jednu stvarnu probnu porudžbinu pre javnog otvaranja i proverite oba emaila.

### Pouzdanost

- Server validira adresu, količine, saglasnost i format zahteva. Srbija i pouzeće su jedine opcije. Nema kartične naplate.
- Iznose računa PostgreSQL na osnovu objavljenih proizvoda; promenu cene/dostave između prikaza i potvrde odbija, umesto da tiho promeni iznos.
- Jedna transakcija čuva porudžbinu, kopije naziva/cena/varijanti, prihvaćene uslove i dva email zadatka. Naknadna izmena proizvoda ne menja istoriju porudžbine.
- Idempotency UUID + hash sadržaja + zaključavanje transakcije sprečavaju dupliranje kada kupac ponovi isti zahtev posle prekida veze. Promenjen sadržaj sa istim ključem se odbija.
- Korpa se čuva lokalno. Podaci neuspelog pokušaja checkouta ostaju samo u sessionStorage tog taba radi sigurnog ponavljanja i brišu se nakon uspeha.
- Rate limit u bazi: 20 zahteva/IP i 5/email u deset minuta. IP/email su HMAC hash vrednosti. Za samostalni hosting proxy mora pouzdano postaviti `x-vercel-forwarded-for`; Vercel to radi. Bez tog zaglavlja koristi se zajednički lokalni limit.
- Email se šalje nakon uspešnog čuvanja, preko durable outbox-a i Resend idempotency ključa. Greška u Resend-u ne briše porudžbinu. Admin vidi status i može ponoviti neuspešno slanje.
- Vercel Cron u `vercel.json` ponavlja red jednom dnevno (08:00 UTC), do 10 zadataka po prolazu. Za veću prodaju podesite češći raspored na odgovarajućem Vercel planu. Najviše osam pokušaja, zatim intervencija administratora. Resend idempotency važi 24 sata; nakon nejasnog ishoda i kasnijeg ručnog ponavljanja proveriti Resend log da se izbegne duplikat.
- Endpoint `/api/jobs/emails` zahteva `Authorization: Bearer CRON_SECRET`. Vercel Cron ga postavlja koristeći istoimenu environment promenljivu.
- Kupci ne mogu čitati porudžbine ni menjati katalog. Admin može menjati status porudžbine, ali ne iznose i adresu već sačuvane porudžbine.
- Storage bucket je javan za prikaz slika, upis dozvoljen samo administratorima. Uklanjanje slike iz proizvoda ne briše fajl iz skladišta da ne bi oštetilo druge reference; periodično uklonite nekorišćene fajlove u Supabase-u.

## GitHub i Vercel

Folder `offwall` je koren projekta. Uključeni su zaključane verzije (`pnpm-lock.yaml`), `.gitignore`, CI i Vercel konfiguracija. Tajne, build izlazi i dependencies nisu za Git.

```sh
git init
git add .
git commit -m "Build OFFWALL storefront and commerce admin"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

U Vercel-u importujte repozitorijum, izaberite Next.js i Node 22+, pa unesite environment promenljive iz `.env.example`. Za Preview i Production koristite odvojene Supabase projekte ili držite Preview checkout zatvoren. `NEXT_PUBLIC_SITE_URL` mora odgovarati domenu konkretne instalacije. Posle menjanja promenljivih uradite redeploy. Dodajte domen, podesite DNS i proverite HTTPS. Projekat ovim nije automatski objavljen ni povezan sa vašim nalozima.

## Provere

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Unit/integracioni testovi izvršavaju SQL migraciju u pravom PostgreSQL okruženju preko PGlite-a sa minimalnim Supabase auth/storage tabelama za test. Pokrivaju RLS, admin prava, transakcije, cenu, promenu cene, neaktivnu prodavnicu, neobjavljen proizvod, idempotency, rate limit i red za email. To nije zamena za live Supabase/Resend smoke test sa vašim ključevima.

Playwright proverava desktop i mobilni pregled bez Supabase ključeva: Figma slike, širinu stranice, pretragu, varijante, čuvanje/brisanje korpe, FAQ, zatvoren checkout i zaštitu job endpoint-a.

CI na GitHub-u izvršava ove provere. Za E2E koristite okruženje bez live Supabase tajni; testovi podrazumevaju zatvoreni lokalni preview.

## Obuhvat i sledeći korak

Implementirano: prodavnica, proizvodi/varijante/slike/publish, admin autentifikacija, porudžbine/statusi, pouzeće u Srbiji, konfiguracija dostave i dva Resend emaila. Kontakt za custom poster vodi na email prodavnice ili OFFWALL Instagram. Sekcije poklon kartica, korisničkih naloga, wishlist-a i newsletter-a iz šireg prototipa nisu deo ovog checkout obuhvata i nemaju lažne kontrole.

Pre javnog otvaranja ostaje povezivanje stvarnih Supabase/Resend naloga, unos poslovnih podataka i pravih cena, i live test porudžbine, Storage upload-a, prijave i oba emaila. Preporučeno: Supabase backup, praćenje grešaka i proces obrade porudžbina. Admin prikazuje poslednjih 200 porudžbina; celokupna istorija ostaje u bazi.

## Dizajn i izvori

- [OFFWALL Figma, 04 · Prototype](https://www.figma.com/design/YBHrTiFdSPfbH1CPybKR0k/OFFWALL-WEB?node-id=7-15): desktop `15:18`, mobile `15:20`.
- Fotografije su tačni eksporti iz dostavljenog dizajna, sačuvani u `public/artwork` da ne zavise od privremenih Figma URL-ova.
- Space Grotesk i Inter učitavaju se lokalno preko Fontsource paketa; nema runtime zahteva Google Fonts-u.
- [Next.js dokumentacija](https://nextjs.org/docs/app/getting-started), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
