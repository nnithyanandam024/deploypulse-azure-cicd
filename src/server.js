const http = require('node:http');
const url = require('node:url');

const APP_NAME = 'DeployPulse';
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const APP_VERSION = process.env.APP_VERSION || 'development';
const START_TIME = Date.now();

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

function renderDashboardHtml(uptimeSeconds) {
  const shortVersion = APP_VERSION.length > 8 ? APP_VERSION.substring(0, 8) : APP_VERSION;
  const isProd = process.env.NODE_ENV === 'production';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeployPulse | System Dashboard</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --accent: #2563eb;
      --accent-soft: rgba(37, 99, 235, 0.1);
      --success: #10b981;
      --success-soft: rgba(16, 185, 129, 0.12);
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.5;
      padding: 2.5rem 1.25rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 880px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 2rem;
    }

    .brand {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 0 3px var(--success-soft);
      display: inline-block;
    }

    .brand-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      background-color: var(--success-soft);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.25);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 1.25rem;
    }

    .card-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-size: 1.15rem;
      font-weight: 600;
      font-family: var(--font-mono);
      color: #ffffff;
      word-break: break-all;
    }

    .section {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    th {
      text-align: left;
      font-weight: 600;
      color: var(--text-dim);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--card-border);
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid rgba(31, 41, 55, 0.6);
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .method {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(37, 99, 235, 0.15);
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }

    .endpoint-link {
      font-family: var(--font-mono);
      color: #93c5fd;
      text-decoration: none;
    }

    .endpoint-link:hover {
      text-decoration: underline;
    }

    .flow-diagram {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }

    .flow-step {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      color: #e2e8f0;
    }

    .flow-arrow {
      color: var(--text-dim);
      font-size: 0.85rem;
    }

    footer {
      margin-top: auto;
      padding-top: 2rem;
      width: 100%;
      max-width: 880px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      color: var(--text-dim);
      font-size: 0.8rem;
    }

    @media (max-width: 640px) {
      header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .grid {
        grid-template-columns: 1fr;
      }
      footer {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-title">
          <span class="status-dot"></span>
          DeployPulse
        </div>
        <div class="brand-subtitle">Automated CI/CD Pipeline for Web Applications</div>
      </div>
      <div>
        <span class="badge">System Operational</span>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-label">Application Status</div>
        <div class="card-value" style="color: var(--success);">HEALTHY</div>
      </div>
      <div class="card">
        <div class="card-label">Release Version</div>
        <div class="card-value" title="${APP_VERSION}">${shortVersion}</div>
      </div>
      <div class="card">
        <div class="card-label">Service Uptime</div>
        <div class="card-value" id="uptime-display">${formatUptime(uptimeSeconds)}</div>
      </div>
      <div class="card">
        <div class="card-label">Runtime Environment</div>
        <div class="card-value">Node.js ${process.version}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        <span>Application Endpoints</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">HTTP Verification Interface</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Description</th>
            <th>Response Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method">GET</span></td>
            <td><a class="endpoint-link" href="/">/</a></td>
            <td>Web Status Dashboard</td>
            <td><code>text/html</code></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><a class="endpoint-link" href="/health">/health</a></td>
            <td>Health Check Probe (Docker / Smoke Test)</td>
            <td><code>application/json</code></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><a class="endpoint-link" href="/api/info">/api/info</a></td>
            <td>Release & Pipeline Version Metadata</td>
            <td><code>application/json</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">CI/CD Pipeline Architecture</div>
      <div class="flow-diagram">
        <div class="flow-step">Git Push (main)</div>
        <span class="flow-arrow">&rarr;</span>
        <div class="flow-step">GitHub Actions</div>
        <span class="flow-arrow">&rarr;</span>
        <div class="flow-step" style="border-color: #059669; color: #34d399;">Quality Gate (npm test)</div>
        <span class="flow-arrow">&rarr;</span>
        <div class="flow-step">Docker Compose Build</div>
        <span class="flow-arrow">&rarr;</span>
        <div class="flow-step">Azure VM Deploy</div>
        <span class="flow-arrow">&rarr;</span>
        <div class="flow-step">Nginx (:80)</div>
      </div>
    </div>

    <footer>
      <div>Team DEVNEST &bull; Bannari Amman Institute of Technology</div>
      <div>DevOps Community Hackathon 2026</div>
    </footer>
  </div>

  <script>
    // Lightweight uptime ticker
    let uptimeSec = ${uptimeSeconds};
    setInterval(() => {
      uptimeSec++;
      const d = Math.floor(uptimeSec / 86400);
      const h = Math.floor((uptimeSec % 86400) / 3600);
      const m = Math.floor((uptimeSec % 3600) / 60);
      const s = Math.floor(uptimeSec % 60);
      const parts = [];
      if (d > 0) parts.push(d + 'd');
      if (h > 0) parts.push(h + 'h');
      if (m > 0) parts.push(m + 'm');
      parts.push(s + 's');
      const el = document.getElementById('uptime-display');
      if (el) el.textContent = parts.join(' ');
    }, 1000);
  </script>
</body>
</html>`;
}

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname } = parsedUrl;

    // Root Dashboard
    if (req.method === 'GET' && pathname === '/') {
      const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);
      const html = renderDashboardHtml(uptimeSeconds);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(html);
      return;
    }

    // Health Endpoint
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

    // Force exit after 5s if still hanging
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
