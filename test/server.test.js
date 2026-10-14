const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server.js');

describe('DeployPulse Automated Test Suite', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => {
      // Listen on port 0 to let the OS assign an ephemeral unused port
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  });

  // TC-01: Root Dashboard Verification
  it('TC-01: GET / should return HTTP 200 with HTML dashboard', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200, 'Expected HTTP 200 status code');
    const contentType = res.headers.get('content-type');
    assert.match(contentType, /text\/html/, 'Expected Content-Type to be text/html');

    const body = await res.text();
    assert.ok(body.includes('DeployPulse'), 'Dashboard body should include "DeployPulse"');
    assert.ok(body.includes('Application Status'), 'Dashboard body should include "Application Status"');
    assert.ok(body.includes('/health'), 'Dashboard body should include link to /health');
  });

  // TC-02: Health Endpoint Verification
  it('TC-02: GET /health should return HTTP 200 with health metadata', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200, 'Expected HTTP 200 status code');
    const contentType = res.headers.get('content-type');
    assert.match(contentType, /application\/json/, 'Expected Content-Type to be application/json');

    const data = await res.json();
    assert.equal(data.status, 'ok', 'Expected status to be "ok"');
    assert.equal(data.app, 'DeployPulse', 'Expected app to be "DeployPulse"');
    assert.equal(typeof data.uptime, 'number', 'Expected uptime to be a number');
    assert.ok(data.uptime >= 0, 'Uptime must be non-negative');
  });

  // TC-03: Release Information Endpoint Verification
  it('TC-03: GET /api/info should return HTTP 200 with release metadata', async () => {
    const res = await fetch(`${baseUrl}/api/info`);
    assert.equal(res.status, 200, 'Expected HTTP 200 status code');
    const contentType = res.headers.get('content-type');
    assert.match(contentType, /application\/json/, 'Expected Content-Type to be application/json');

    const data = await res.json();
    assert.equal(data.app, 'DeployPulse', 'Expected app to be "DeployPulse"');
    assert.ok(data.version, 'Expected version to be present');
    assert.equal(typeof data.version, 'string', 'Expected version to be a string');
    assert.ok(data.node, 'Expected node version to be present');
  });

  // TC-04: Unsupported Route Handling
  it('TC-04: GET /invalid-route-xyz should return HTTP 404 with JSON error', async () => {
    const res = await fetch(`${baseUrl}/invalid-route-xyz`);
    assert.equal(res.status, 404, 'Expected HTTP 404 status code');
    const contentType = res.headers.get('content-type');
    assert.match(contentType, /application\/json/, 'Expected Content-Type to be application/json');

    const data = await res.json();
    assert.equal(data.error, 'Not Found', 'Expected error to be "Not Found"');
    assert.equal(data.path, '/invalid-route-xyz', 'Expected path to match requested route');
  });
});
