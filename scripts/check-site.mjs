import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://khushaankgupta.qzz.io';
const pages = ['index.html', '404.html'];
const titles = new Set();
const descriptions = new Set();
const publicURLs = [];

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && !titles.has(title), `${file}: missing or duplicate title`);
  assert(description && !descriptions.has(description), `${file}: missing or duplicate description`);
  titles.add(title);
  descriptions.add(description);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: expected one h1`);
  assert(html.includes('<html lang="en">'), `${file}: language missing`);
  if (file === 'index.html') assert(html.includes('href="#main-content"'), 'Homepage: skip link missing');
  assert(html.includes('name="viewport"'), `${file}: viewport missing`);

  for (const [, reference] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|#)/.test(reference)) {
      if (reference.startsWith('#')) {
        assert(html.includes(`id="${reference.slice(1)}"`), `${file}: broken anchor ${reference}`);
      }
      continue;
    }
    const localPath = reference === '/' ? 'index.html' : reference.replace(/^\//, '');
    assert(fs.existsSync(path.join(root, localPath)), `${file}: broken local reference ${reference}`);
    if (file === '404.html') {
      assert(reference.startsWith('/'), `404: ${reference} would break at a nested missing URL`);
    }
  }

  for (const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert(/rel="[^"]*noopener[^"]*"/.test(tag[0]), `${file}: unsafe external link`);
  }

  if (file === '404.html') {
    assert(html.includes('content="noindex, follow"'), '404 must not be indexed');
    assert(!html.includes('rel="canonical"'), '404 should not canonicalize missing pages');
    assert(html.includes('<h1>404</h1>'));
    assert(html.includes('<p>This page could not be found.</p>'));
    assert(!/<nav|<footer|<a\b/.test(html), '404 should contain only the error message');
    continue;
  }

  const url = `${origin}/${file === 'index.html' ? '' : file}`;
  publicURLs.push(url);
  assert(html.includes(`rel="canonical" href="${url}"`), `${file}: wrong canonical`);
  assert(html.includes(`property="og:url" content="${url}"`), `${file}: wrong social URL`);
  assert(html.includes(`property="og:image" content="${origin}/hero.png"`), `${file}: social image missing`);
  assert(html.includes('name="twitter:card"'), `${file}: social card missing`);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema.url, url);
  if (file === 'index.html') {
    assert.equal(schema['@type'], 'ProfilePage');
    assert.equal(schema.mainEntity.name, 'Khushaank Gupta');
    assert(schema.mainEntity.sameAs.includes('https://www.chess.com/member/ogkgc'));
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), publicURLs);
assert(!sitemap.includes('404.html'));
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes('User-agent: *\nAllow: /'));
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.equal(fs.readFileSync(path.join(root, 'CNAME'), 'utf8').trim(), new URL(origin).hostname);
assert(!fs.existsSync(path.join(root, 'khushaank-premium.html')), 'Duplicate premium homepage remains');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(home.includes('Curious about how companies work, what makes them last, and the ideas shaping their future.'));
assert(home.includes('fetchpriority="high"'));
assert(home.includes('width="116" height="116"'));
assert(home.includes('https://www.chess.com/member/ogkgc'));
for (const removed of ['about.html', 'contact.html', 'privacy.html']) {
  assert(!fs.existsSync(path.join(root, removed)), `Unwanted page remains: ${removed}`);
  assert(!home.includes(removed), `Homepage still links to ${removed}`);
}
console.log(`Passed: ${pages.length} pages, unique metadata, local links, structured data, sitemap, robots, domain, and nested 404 links.`);
