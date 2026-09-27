import type { Metadata } from 'next';
import { SITE_URL, homeSeo } from '@/lib/seo';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import './globals.css';
import { CartProvider } from '@/components/cart-provider';
import { Header } from '@/components/header';
import Link from 'next/link';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: homeSeo.title, template: '%s | OFFWALL' },
  description: homeSeo.description,
  openGraph: { type: 'website', locale: 'sr_RS', siteName: 'OFFWALL' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body>
        <CartProvider>
          <a className="skip-link" href="#sadrzaj">
            Preskoči na sadržaj
          </a>
          <Header />
          <main id="sadrzaj">{children}</main>
          <footer className="section ink stack">
            <h2>
              SKINI IDEJU
              <br />
              SA EKRANA.
            </h2>
            <p>Stavi je na svoj zid. Prati nove radove i javi nam šta želiš da napravimo.</p>
            <a
              className="button primary"
              href="https://www.instagram.com/offwall.rs/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram / @offwall.rs
            </a>
            <div className="controls">
              <Link className="button" href="/informacije/dostava">
                Dostava i povrat
              </Link>
              <Link className="button" href="/informacije/privatnost">
                Privatnost
              </Link>
              <Link className="button" href="/informacije/uslovi">
                Uslovi kupovine
              </Link>
              <Link className="button" href="/informacije/kontakt">
                Kontakt
              </Link>
            </div>
            <p className="caption">
              OFFWALL / POSTERI SA LIČNIM PEČATOM
              <br />© {new Date().getFullYear()} OFFWALL. Prikazi proizvoda: @offwall.rs.
            </p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
