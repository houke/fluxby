import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadStream, existsSync, statSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.join(__dirname, '..');
const siteDir = path.join(root, 'dist');

const port = Number(process.env.PORT || 5177);

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.wasm':
      return 'application/wasm';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

function safeResolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const clean = decoded.split('?')[0].split('#')[0];
  const joined = path.join(siteDir, clean);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(siteDir)) return null;
  return normalized;
}

function sendFile(res, filePath, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': contentTypeFor(filePath),
  });
  createReadStream(filePath).pipe(res);
}

function send404(res) {
  const notFoundPath = path.join(siteDir, '404.html');
  if (existsSync(notFoundPath)) {
    sendFile(res, notFoundPath, 404);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

if (!existsSync(siteDir)) {
  console.error(`Missing ${siteDir}. Run: npm run build:pages`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestUrl = req.url || '/';
  const requestPath = requestUrl.split('?')[0].split('#')[0];

  // Redirect directory without trailing slash (e.g. /app -> /app/)
  const resolved = safeResolvePath(requestPath);
  if (!resolved) {
    send404(res);
    return;
  }

  try {
    if (existsSync(resolved)) {
      const stats = statSync(resolved);
      if (stats.isDirectory()) {
        if (!requestPath.endsWith('/')) {
          res.writeHead(301, { Location: `${requestPath}/` });
          res.end();
          return;
        }
        const indexPath = path.join(resolved, 'index.html');
        if (existsSync(indexPath)) {
          sendFile(res, indexPath);
          return;
        }
        send404(res);
        return;
      }

      sendFile(res, resolved);
      return;
    }

    send404(res);
  } catch {
    send404(res);
  }
});

server.listen(port, () => {
  console.log(`Serving dist at http://localhost:${port}/`);
});
