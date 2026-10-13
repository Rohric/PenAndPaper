// Draw the QR code that leads a phone to the login page, with the address this computer has in
// the network right now. "npm run start:lan" runs it before the frontend starts.
// The encoder is the one that comes with npm, so nothing has to be installed.
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = 4200;
const TARGET = path.join(__dirname, '..', 'public', 'login-qr.svg');
const ENCODER = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'node_modules', 'qrcode-terminal', 'vendor', 'QRCode');
const SIZE = 12;
const QUIET = 4;

/** Find the address of this computer in the home network; virtual adapters are left out. */
function lanAddress() {
  const found = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    const usable = (addresses ?? []).filter((address) => address.family === 'IPv4' && !address.internal);
    if (!name.startsWith('vEthernet')) {
      found.push(...usable.map((address) => address.address));
    }
  }
  return found.find((address) => address.startsWith('192.168.') || address.startsWith('10.')) ?? found[0] ?? null;
}

/** Turn a text into a QR code: its width in squares and a test for every square. */
function encode(text) {
  const QRCode = require(ENCODER);
  const code = new QRCode(-1, require(path.join(ENCODER, 'QRErrorCorrectLevel')).M);
  code.addData(text);
  code.make();
  return code;
}

/** Draw every dark square of the code as a rectangle. */
function squares(code) {
  const count = code.getModuleCount();
  const rects = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (code.isDark(row, col)) {
        rects.push(`<rect x="${(col + QUIET) * SIZE}" y="${(row + QUIET) * SIZE}" width="${SIZE}" height="${SIZE}"/>`);
      }
    }
  }
  return rects.join('');
}

/** Build the picture: the code on white with the address below it. */
function picture(url) {
  const code = encode(url);
  const width = (code.getModuleCount() + 2 * QUIET) * SIZE;
  const text = `<text x="${width / 2}" y="${width + 22}" text-anchor="middle" font-family="Consolas, monospace" font-size="20">${url}</text>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${width + 44}">` +
    `<rect width="100%" height="100%" fill="#ffffff"/><g fill="#000000">${squares(code)}${text}</g></svg>\n`
  );
}

/** Write the picture into the public folder; a failure only warns, so the frontend still starts. */
function main() {
  const address = process.argv[2] ? null : lanAddress();
  if (!address && !process.argv[2]) {
    console.warn('QR-Code: keine Adresse im Netzwerk gefunden.');
    return;
  }
  // An address from the command line, like the one of a tunnel, wins over the one of this computer.
  const url = process.argv[2] ?? `http://${address}:${PORT}/login`;
  try {
    fs.writeFileSync(TARGET, picture(url), 'utf8');
    console.log(`QR-Code für ${url} liegt in public/login-qr.svg`);
  } catch (error) {
    console.warn('QR-Code konnte nicht erzeugt werden:', error.message);
  }
}

main();
