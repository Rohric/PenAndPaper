// Start the frontend and a public tunnel to it, so phones reach the app from any network.
// The tunnel address changes with every start; the QR code is drawn anew with it.
const { spawn } = require('child_process');
const path = require('path');

const PORT = 4200;
const TUNNEL = path.join(__dirname, 'cloudflared.exe');
const ADDRESS = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

const frontend = spawn(`npx ng serve --port ${PORT}`, { shell: true, stdio: 'inherit' });
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
