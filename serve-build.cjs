const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  // SPA routing: serve index.html for non-file paths
  let filePath = path.join('docs', url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = 'docs/index.html';
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found: ' + url);
    return;
  }
  const ext = path.extname(filePath);
  const ct = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.css': 'text/css'
  }[ext] || 'text/plain';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(filePath));
}).listen(9999, () => {
  console.log('Server running on http://localhost:9999');
});
