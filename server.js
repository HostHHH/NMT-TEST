// server.js - локальний сервер для тестування iSторія
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

const server = http.createServer((req, res) => {
    // API: Опитування тестувальників для МАН (Розділ 3)
    if (req.url === '/api/survey') {
        const dataFile = path.join(__dirname, 'survey_responses.json');
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const parsed = JSON.parse(body || '{}');
                    parsed.timestamp = new Date().toISOString();
                    let list = [];
                    if (fs.existsSync(dataFile)) {
                        try { list = JSON.parse(fs.readFileSync(dataFile, 'utf-8')); } catch (_) { list = []; }
                    }
                    list.push(parsed);
                    fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: true, count: list.length }));
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
            return;
        } else if (req.method === 'GET') {
            let list = [];
            if (fs.existsSync(dataFile)) {
                try { list = JSON.parse(fs.readFileSync(dataFile, 'utf-8')); } catch (_) { list = []; }
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(list));
            return;
        }
    }

    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    const safePath = path.normalize(path.join(__dirname, reqUrl));
    if (!safePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${reqUrl}`);
            return;
        }

        let filePath = safePath;
        if (stats.isDirectory()) {
            filePath = path.join(safePath, 'index.html');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        // Підтримка Range requests для аудіо та 3D моделей
        const range = req.headers.range;
        if (range && (ext === '.mp3' || ext === '.glb' || ext === '.wav')) {
            const fileSize = stats.size;
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
        }

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*'
        });

        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[iSторія Server] Сервер успішно запущено на порті ${PORT}!`);
    console.log(`  > Головна:        http://localhost:${PORT}/`);
    console.log(`  > Налаштування:   http://localhost:${PORT}/home/index.html`);
    console.log(`  > Козацький Шлях: http://localhost:${PORT}/game/game.html`);
    console.log(`  > 3D Карта:       http://localhost:${PORT}/map/map.html`);
    console.log(`  > Про проєкт:     http://localhost:${PORT}/about/about.html`);
});
