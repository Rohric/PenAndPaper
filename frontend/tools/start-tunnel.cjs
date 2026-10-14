// Start the frontend and a public tunnel to it, so phones reach the app from any network.
// The tunnel address changes with every start; the QR code is drawn anew with it.
// With "--play" the finished, smaller build is served for a game night (tools/play-server.cjs) instead of the dev server.
const { spawn } = require('child_process');
const path = require('path');

const PORT = 4200;
const TUNNEL = path.join(__dirname, 'cloudflared.exe');
const ADDRESS = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

const PLAY = process.argv.includes('--play');
const command = PLAY ? `npx ng build && node tools/play-server.cjs ${PORT}` : `npx ng serve --port ${PORT}`;
const frontend = spawn(command, { shell: true, stdio: 'inherit', cwd: path.join(__dirname, '..') });
const tunnel = spawn(TUNNEL, ['tunnel', '--url', `http://localhost:${PORT}`], { stdio: ['ignore', 'ignore', 'pipe'] });

let announced = false;
tunnel.stderr.on('data', (chunk) => {
  const found = ADDRESS.exec(chunk.toString());
  if (found && !announced) {
    announced = true;
    const url = `${found[0]}/login`;
    spawn('node', [path.join(__dirname, 'login-qr.cjs'), url], { stdio: 'inherit' });
    console.log(`\nÖffentliche Adresse für die Spieler: ${url}\n`);
  }
});
tunnel.on('error', () => console.error('Der Tunnel konnte nicht starten. Liegt tools/cloudflared.exe da?'));

const stop = () => {
  tunnel.kill();
  frontend.kill();
};
process.on('SIGINT', stop);
process.on('exit', stop);
frontend.on('exit', () => process.exit());
