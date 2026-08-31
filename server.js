import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMarketSessionStatus } from './src/indicators.js';
import { fetchAllData } from './fetch-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

let isRefreshing = false;

const server = http.createServer(async (req, res) => {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const reqPath = urlObj.pathname;

  // API 1: Live Market Session Check
  if (reqPath === '/api/session') {
    const session = getMarketSessionStatus();
    res.writeHead(200, { 
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify({ success: true, timestamp: Date.now(), session }));
    return;
  }

  // API 2: Live Refresh Data
  if (reqPath === '/api/refresh') {
    if (isRefreshing) {
      // If already refreshing, return current data.json with a note
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, refreshing: true, message: 'Veri güncelleme zaten arka planda devam ediyor.' }));
      return;
    }

    isRefreshing = true;
    try {
      console.log('🔄 İstemciden gelen istek üzerine canlı veriler yenileniyor...');
      const freshData = await fetchAllData();
      isRefreshing = false;
      res.writeHead(200, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Veriler başarıyla güncellendi', 
        updatedAt: freshData.updatedAt,
        data: freshData 
      }));
    } catch (err) {
      isRefreshing = false;
      console.error('Veri yenileme hatası:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API 3: Get latest data.json without cache
  if (reqPath === '/api/data' || reqPath === '/data.json') {
    const dataPath = path.join(__dirname, 'data.json');
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf-8');
      res.writeHead(200, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0'
      });
      res.end(content);
      return;
    }
  }

  let servePath = reqPath;
  if (servePath === '/') servePath = '/index.html';

  const filePath = path.join(__dirname, servePath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Sayfa Bulunamadı</h1><p><a href="/">Ana Sayfaya Dön</a></p>');
      } else {
        res.writeHead(500);
        res.end(`Sunucu Hatası: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.json' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 BIST Web Portalı Yerel Olarak Başlatıldı!`);
  console.log(`👉 http://localhost:${PORT}/\n`);
});
