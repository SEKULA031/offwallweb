import Link from 'next/link';
import { absoluteUrl } from '@/lib/seo';
import { StructuredData } from './structured-data';
export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <>
      <nav aria-label="Putanja stranice" className="breadcrumbs">
        <ol>
          {items.map((item, i) => (
            <li key={item.href}>
              {i === items.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.href}>{item.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.href),
          })),
        }}
      />
    </>
  );
}
