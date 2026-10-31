import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicFiles = new Set([
  'index.html', '404.html',
  'styles.css', 'favicon.svg', 'hero.png', 'robots.txt', 'sitemap.xml'
]);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const found = publicFiles.has(requested);
  const file = found ? requested : '404.html';
  fs.readFile(path.join(root, file), (error, body) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read site file.');
      return;
    }
    response.writeHead(found ? 200 : 404, {
      'Content-Type': types[path.extname(file)],
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  });
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
