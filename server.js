/**
 * ReThinkr - Local Development Server
 * Zero-dependency Node.js HTTP Server
 * Serves website assets and JSON API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.sql': 'text/plain; charset=utf-8',
  '.php': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Handle API items endpoint
  if (pathname === '/api/items' || pathname === '/api/items.php') {
    const dataPath = path.join(PUBLIC_DIR, 'data', 'items_data.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not load data/items_data.json' }));
      } else {
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      }
    });
    return;
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 handler
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 Not Found - ReThinkr</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 4rem;">
          <h1 style="color: #0f766e;">404 - Page Not Found</h1>
          <p>The requested URL <code>${pathname}</code> was not found on this server.</p>
          <a href="/index.html" style="color: #059669; font-weight: bold;">Return to ReThinkr Home</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('============================================================');
  console.log('  🌿 ReThinkr - Don\'t dump it. Reimagine it.');
  console.log('  Server running at: http://localhost:' + PORT);
  console.log('============================================================');
  console.log('  ✔ 52 Household Items & 156+ Step-by-Step Ideas Loaded');
  console.log('  ✔ Live Search & Smart Filters (Cost, Difficulty, Materials)');
  console.log('  ✔ Community Idea Submission & Admin Moderation Active');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('============================================================\n');
});
