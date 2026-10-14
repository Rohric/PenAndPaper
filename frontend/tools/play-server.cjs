// Serve the finished build for a game night: the small, packed files from "ng build", with "/api" and
// "/media" passed on to the backend. The Angular dev server always adds source maps and packs nothing,
// which makes it several times heavier on the phones. Uses only what comes with Node.
// Usage: node tools/play-server.cjs [port]   (after "ng build"; the backend runs on port 8000)
const fs = require('fs');
const http = require('http');
const path = require('path');
const zlib = require('zlib');

const PORT = Number(process.argv[2] || process.env.PORT || 4200);
const BACKEND = { host: '127.0.0.1', port: Number(process.env.BACKEND_PORT || 8000) };
const ROOT = path.join(__dirname, '..', 'dist', 'frontend', 'browser');
const PUBLIC = path.join(__dirname, '..', 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};
const PACKED = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);
// Files with a hash in their name never change; everything else is asked for again.
const HASHED = /-[A-Z0-9]{8}\.(js|css)$/;
const cache = new Map();

/** Pass a request on to the backend and its answer back. */
function proxy(request, response) {
  const options = { ...BACKEND, path: request.url, method: request.method, headers: { ...request.headers, host: `${BACKEND.host}:${BACKEND.port}` } };
  const forward = http.request(options, (answer) => {
    response.writeHead(answer.statusCode || 502, answer.headers);
    answer.pipe(response);
  });
  forward.on('error', () => {
    response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Das Backend antwortet nicht. Läuft runserver auf Port 8000?');
  });
  request.pipe(forward);
}

/** The file for an address: from the build, the QR code fresh from public/, unknown pages lead to the app. */
function fileFor(pathname) {
  if (pathname === '/login-qr.svg') {
    return path.join(PUBLIC, 'login-qr.svg');
  }
  const file = path.join(ROOT, path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, ''));
  if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    return file;
  }
  return path.extname(pathname) ? null : path.join(ROOT, 'index.html');
}

/** Read a file once, packed when that helps, and keep it. The QR code is read fresh every time. */
function load(file) {
  if (cache.has(file)) {
    return cache.get(file);
  }
  const body = fs.readFileSync(file);
  const extension = path.extname(file);
  const entry = { body, packed: PACKED.has(extension) ? zlib.gzipSync(body, { level: 9 }) : null, type: TYPES[extension] || 'application/octet-stream' };
  if (!file.startsWith(PUBLIC)) {
    cache.set(file, entry);
  }
  return entry;
}

function serve(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = fileFor(pathname);
  if (!file || !fs.existsSync(file)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Nicht gefunden');
    return;
  }
  const entry = load(file);
  const gzip = entry.packed && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
  response.writeHead(200, {
    'Content-Type': entry.type,
    'Cache-Control': HASHED.test(file) ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
  });
  response.end(gzip ? entry.packed : entry.body);
}

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error('Es gibt noch keinen Build. Erst "npx ng build" ausführen, oder "npm run start:play" nehmen.');
  process.exit(1);
}

http
  .createServer((request, response) => (/^\/(api|media)\//.test(request.url) ? proxy(request, response) : serve(request, response)))
  .listen(PORT, '0.0.0.0', () => console.log(`Spielmodus läuft auf Port ${PORT}. Backend: ${BACKEND.host}:${BACKEND.port}.`));
