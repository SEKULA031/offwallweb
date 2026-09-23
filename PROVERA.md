# Provera OFFWALL projekta

Datum: 22. septembar 2026.

## Prošlo lokalno

- Next.js produkcijski build (16.3.6).
- TypeScript bez grešaka.
- ESLint bez grešaka i upozorenja.
- 19 testova validacije i PostgreSQL poslovne logike.
- 8 Playwright testova: desktop Chromium i mobilna širina iPhone 13 u Chromium-u.
- Ručni vizuelni pregled desktop 1440 px i mobile 390 px, uz Figma referencu. Nema horizontalnog skrolovanja ni prijavljenih JavaScript grešaka.
- Originalne slike preuzete u projekat; nema zavisnosti od privremenih Figma URL-ova.

Testirane su transakcije, RLS, zabrana javnog pristupa porudžbinama, admin izmene/publish, zabrana izmene istorijskih iznosa, rollback neuspele izmene, duplikati porudžbina, promena cene, zatvorena prodavnica, skriveni proizvodi, rate limit i preuzimanje email zadataka. U pregledaču su provereni katalog, pretraga, format/ram, lokalno čuvanje korpe, uklanjanje stavke, FAQ i zatvoren checkout.

## Još nije provereno na stvarnim nalozima

Nisu dostavljeni Supabase, Resend, GitHub ili Vercel pristupi. Projekat nije javno objavljen. Nije izvršena stvarna Supabase Auth prijava, upload u korisnikov Storage, niti slanje emailova sa verifikovanog domena. SQL je izvršen u PGlite test bazi sa simuliranim Supabase auth/storage okruženjem.

Pre javnog otvaranja pratiti README: pokrenuti migraciju, napraviti admina, povezati ključeve kroz environment promenljive, verifikovati Resend domen, uneti odobrene poslovne podatke/uslove i stvarne cene, pa proveriti jednu probnu porudžbinu, oba emaila i status porudžbine u adminu. Probne Figma cene se ne objavljuju automatski.
