/**
 * Menjalankan demo laptop Sprint 2 sekaligus:
 * 1. Backend AI Proxy Gemini (127.0.0.1:3001)
 * 2. Expo Web Metro Bundler (http://localhost:8081)
 */

const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const children = [];

function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  const aiBusy = await isPortOpen('127.0.0.1', 3001);
  if (aiBusy) {
    console.log('[demo:laptop] Backend AI Proxy sudah aktif di http://127.0.0.1:3001');
  } else {
    const aiProc = spawn(process.execPath, [path.join(__dirname, 'ai-proxy-server.cjs')], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    children.push(aiProc);
  }

  const webBusy = await isPortOpen('127.0.0.1', 8081);
  if (webBusy) {
    console.log('[demo:laptop] Expo Web sudah aktif di http://localhost:8081');
  } else {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'cmd.exe' : 'npx';
    const args = isWin ? ['/c', 'npx', 'expo', 'start', '--web', '--port', '8081'] : ['expo', 'start', '--web', '--port', '8081'];
    const webProc = spawn(cmd, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    });
    children.push(webProc);
  }

  console.log('\n==============================================================');
  console.log(' Demo Laptop PraktiKu Sprint 2 Siap:');
  console.log(' - Aplikasi Web : http://localhost:8081');
  console.log(' - Backend AI   : http://127.0.0.1:3001/health');
  console.log(' - Tekan Ctrl+C untuk menghentikan proses yang dijalankan.');
  console.log('==============================================================\n');

  if (!children.length) {
    console.log('[demo:laptop] Kedua layanan sudah berjalan di background.');
  }
})();
