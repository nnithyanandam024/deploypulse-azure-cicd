const http = require('node:http');
const url = require('node:url');
const fs = require('node:fs');
const path = require('node:path');

const APP_NAME = 'DeployPulse';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const APP_VERSION = process.env.APP_VERSION || 'development';
const START_TIME = Date.now();
const VIEWS_DIR = path.join(__dirname, 'views');

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function renderTemplate(templateName, uptimeSeconds) {
  const filePath = path.join(VIEWS_DIR, `${templateName}.html`);
  if (!fs.existsSync(filePath)) {
    return `<h1>DeployPulse: Template ${templateName} not found</h1>`;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const shortVersion = APP_VERSION.length > 8 ? APP_VERSION.substring(0, 8) : APP_VERSION;
  const uptimeFormatted = formatUptime(uptimeSeconds);

  html = html
    .replace(/\{\{APP_VERSION\}\}/g, APP_VERSION)
    .replace(/\{\{SHORT_VERSION\}\}/g, shortVersion)
    .replace(/\{\{UPTIME_FORMATTED\}\}/g, uptimeFormatted)
    .replace(/\{\{UPTIME_SECONDS\}\}/g, uptimeSeconds.toString())
    .replace(/\{\{NODE_VERSION\}\}/g, process.version);

  return html;
}

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;

    // Root Dashboard
    if (req.method === 'GET' && pathname === '/') {
      const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
      const html = renderTemplate('index', uptimeSeconds);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(html);
      return;
    }

    // Visual A/B Release Comparison & Diff
    if (req.method === 'GET' && pathname === '/demo') {
      const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
      const html = renderTemplate('demo', uptimeSeconds);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(html);
      return;
    }


    // Health Endpoint (Docker probe & smoke tests)
    if (req.method === 'GET' && pathname === '/health') {
      const payload = {
        status: 'ok',
        app: APP_NAME,
        uptime: Math.floor((Date.now() - START_TIME) / 1000)
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(JSON.stringify(payload));
      return;
    }

    // Release Info Endpoint
    if (req.method === 'GET' && pathname === '/api/info') {
      const payload = {
        app: APP_NAME,
        version: APP_VERSION,
        node: process.version,
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        timestamp: new Date().toISOString()
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(JSON.stringify(payload));
      return;
    }

    // 404 Not Found for any other route
    const notFoundPayload = {
      error: 'Not Found',
      path: pathname
    };
    res.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(notFoundPayload));
  });
}

function startServer(port = PORT, host = HOST) {
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`[${APP_NAME}] Server listening on http://${host}:${port}`);
    console.log(`[${APP_NAME}] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${APP_NAME}] Version: ${APP_VERSION}`);
  });

  const shutdown = (signal) => {
    console.log(`[${APP_NAME}] Received ${signal}, closing server gracefully...`);
    server.close(() => {
      console.log(`[${APP_NAME}] Server closed.`);
      process.exit(0);
    });

    setTimeout(() => {
      console.error(`[${APP_NAME}] Forcefully shutting down.`);
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
  formatUptime
};
