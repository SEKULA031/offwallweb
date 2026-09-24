'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useCart } from './cart-provider';
export function Header() {
  const { items } = useCart();
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <Link className="logo" href="/" aria-label="OFFWALL početna">
        <Image src="/offwall-logo.png" alt="" width={48} height={48} />
        <span>OFFWALL</span>
      </Link>
      <nav className={open ? 'nav open' : 'nav'} aria-label="Glavna navigacija" id="main-nav">
        {[
          ['Posteri', '/posteri'],
          ['Ramovi', '/#ramovi'],
          ['Po tvojoj meri', '/#po-meri'],
          ['O nama', '/#o-nama'],
          ['Pretraga', '/posteri#pretraga'],
        ].map(([label, href]) => (
          <Link className="button" key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <button
        className="menu button"
        aria-controls="main-nav"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Zatvori' : 'Meni'}
      </button>
      <Link href="/korpa" className="button dark cart-link">
        Korpa ({items.reduce((s, i) => s + i.quantity, 0)})
      </Link>
    </header>
  );
}
