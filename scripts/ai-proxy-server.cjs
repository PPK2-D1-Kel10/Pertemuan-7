/**
 * Server Proxy Backend Tepercaya untuk API AI Pengajar
 * 
 * Penggunaan:
 * node scripts/ai-proxy-server.cjs
 * 
 * Arsitektur Keamanan:
 * - Menyimpan secret key / token API AI secara aman di sisi server (tidak terekspos ke bundle Expo / mobile client).
 * - Menerima permintaan POST dari aplikasi klien pada endpoint /api/classify.
 * - Meneruskan payload ke API AI Pengajar resmi saat kontrak API dan deployment aktif.
 */

const http = require('node:http');

const PORT = process.env.PORT || 3001;
const TEACHER_AI_API_URL = process.env.TEACHER_AI_API_URL || '';
const TEACHER_AI_SECRET_KEY = process.env.TEACHER_AI_SECRET_KEY || '';

const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/classify') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const reason = (parsed.reason || '').trim();

        if (!reason) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Field "reason" wajib diisi.' }));
          return;
        }

        // Jika URL API Pengajar resmi dikonfigurasi di server
        if (TEACHER_AI_API_URL) {
          const fetchRes = await fetch(TEACHER_AI_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(TEACHER_AI_SECRET_KEY ? { Authorization: `Bearer ${TEACHER_AI_SECRET_KEY}` } : {}),
            },
            body: JSON.stringify({ reason }),
          });

          if (!fetchRes.ok) {
            throw new Error(`Upstream AI API error: ${fetchRes.status}`);
          }

          const upstreamData = await fetchRes.json();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(upstreamData));
          return;
        }

        // Mode Proxy Aktif (Menunggu URL dari Pengajar)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            category: 'Lain-lain',
            confidence: 0.85,
            explanation: 'Proxy backend aktif. Menunggu endpoint upstream resmi dari pengajar.',
            status: 'proxy_ready',
          })
        );
      } catch (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'praktiKu-ai-proxy', uptime: process.uptime() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[AI Proxy Backend] Server berjalan di http://localhost:${PORT}`);
    console.log(`[AI Proxy Backend] Upstream API: ${TEACHER_AI_API_URL || 'Belum Dikonfigurasi (Menunggu Pengajar)'}`);
  });
}

module.exports = server;
