import { writeFileSync } from 'node:fs';
const origin = 'https://www.theoffwall.com';
const decode = (s) =>
  (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const attr = (tag, name) => decode(tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]);
const text = (s) =>
  decode(
    s
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
const xml = await (await fetch(origin + '/sitemap.xml')).text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => decode(m[1]));
const results = [],
  resources = new Set(),
  links = new Set();
for (const url of [
  ...urls,
  ...['/informacije/uslovi', '/informacije/privatnost', '/korpa', '/checkout', '/admin/login'].map(
    (p) => origin + p,
  ),
]) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    },
  });
  const html = await res.text();
  const meta = [...html.matchAll(/<meta\s[^>]*>/g)].map((m) => m[0]);
  const canonical = [...html.matchAll(/<link\s[^>]*>/g)]
    .map((m) => m[0])
    .find((t) => attr(t, 'rel') === 'canonical');
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
    (m) => JSON.parse(m[1]),
  );
  const h1 = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((m) => text(m[1]));
  const row = {
    url,
    status: res.status,
    title: text(html.match(/<title>(.*?)<\/title>/s)?.[1] || ''),
    description: attr(meta.find((t) => attr(t, 'name') === 'description') || '', 'content'),
    h1,
    canonical: attr(canonical || '', 'href'),
    robots: attr(meta.find((t) => attr(t, 'name') === 'robots') || '', 'content'),
    xRobots: res.headers.get('x-robots-tag'),
    schemaTypes: schemas.map((s) => s['@type']),
    schemas,
    issues: [],
  };
  if (res.status !== 200) row.issues.push('HTTP ' + res.status);
  if (h1.length !== 1) row.issues.push('H1 count ' + h1.length);
  if (urls.includes(url)) {
    if (!row.canonical || new URL(row.canonical).href !== new URL(url).href)
      row.issues.push('Canonical mismatch');
    if (row.robots.includes('noindex') || row.xRobots?.includes('noindex'))
      row.issues.push('Unexpected noindex');
    if (!row.description || !row.title) row.issues.push('Missing metadata');
  }
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const href = attr(m[0], 'href');
    if (!href || href.startsWith('mailto:')) continue;
    try {
      const u = new URL(href, url);
      if (u.hostname === new URL(origin).hostname) {
        u.hash = '';
        links.add(u.href);
      } else if (['theoffwall.com', 'offwallweb.vercel.app'].includes(u.hostname))
        row.issues.push('Non-www internal link: ' + href);
    } catch {}
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const src = attr(m[0], 'src');
    if (src) resources.add(new URL(src, url).href);
    if (!/\balt="/.test(m[0])) row.issues.push('Image missing alt');
  }
  results.push(row);
}
const extraLinks = [];
for (const url of links) {
  if (!results.some((r) => r.url === url)) {
    const r = await fetch(url);
    extraLinks.push({ url, status: r.status, final: r.url });
  }
}
const imageResults = [];
for (const url of resources) {
  const r = await fetch(url, { method: 'HEAD' });
  imageResults.push({ url, status: r.status, type: r.headers.get('content-type') });
}
const redirects = [];
for (const url of [
  'https://theoffwall.com/posteri',
  'https://offwallweb.vercel.app/posteri',
  'https://www.theoffwall.com/posteri/',
  'https://www.theoffwall.com/posteri/nepostojeci-seo-test',
  'https://www.theoffwall.com/posteri/kategorija/nepostojeca',
]) {
  const r = await fetch(url, { redirect: 'manual' });
  redirects.push({ url, status: r.status, location: r.headers.get('location') });
}
const output = {
  checkedAt: new Date().toISOString(),
  sitemapUrls: urls.length,
  results,
  extraLinks,
  imageResults,
  redirects,
};
writeFileSync('docs/seo-audit.json', JSON.stringify(output, null, 2));
console.log(
  JSON.stringify(
    {
      sitemap: urls.length,
      pages: results.length,
      issues: results.filter((r) => r.issues.length).map((r) => ({ url: r.url, issues: r.issues })),
      badLinks: extraLinks.filter((r) => r.status >= 400),
      images: resources.size,
      badImages: imageResults.filter((r) => r.status >= 400),
      redirects,
    },
    null,
    2,
  ),
);
