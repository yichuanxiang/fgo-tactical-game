const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8081;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
};

const NO_CACHE = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT'
};

http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    let filePath = path.join(ROOT, url);

    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    if (req.url.endsWith('/') || !path.extname(filePath)) {
        // Serve index.html for directory requests
        const stats = fs.statSync(filePath, { throwIfNoEntry: false });
        if (stats && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        } else if (!path.extname(filePath)) {
            filePath += '.html';
        }
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found: ' + url);
            return;
        }
        res.writeHead(200, Object.assign({ 'Content-Type': mime }, NO_CACHE));
        res.end(data);
    });
}).listen(PORT, () => {
    console.log('Game server running at http://localhost:' + PORT);
    console.log('Cache-control: DISABLED');
});
