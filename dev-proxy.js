// Simple HTTPS dev proxy for Zendesk preview to avoid CORS
// Forward /hc/* to https://support.snapmaker.com and add permissive CORS for preview domain

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Change to your preview domain if necessary
const PREVIEW_ORIGIN = 'https://snapmaker.zendesk.com';

// CORS preflight handler
// Use a regex route to match any path under /hc to avoid path-to-regexp '*' error
app.options(/^\/hc(?:\/.*)?$/, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', PREVIEW_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type');
  res.status(204).end();
});

// Proxy /hc to support.snapmaker.com
app.use('/hc', createProxyMiddleware({
  target: 'https://support.snapmaker.com',
  changeOrigin: true,
  secure: true,
  // Preserve cookies; note cross-origin cookies are still bound to target domain
  onProxyReq(proxyReq, req, res) {
    // You may adjust headers here if needed
  },
  onProxyRes(proxyRes, req, res) {
    proxyRes.headers['access-control-allow-origin'] = PREVIEW_ORIGIN;
    proxyRes.headers['access-control-allow-credentials'] = 'true';
    proxyRes.headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = req.headers['access-control-request-headers'] || 'Content-Type';
  }
}));

// Load local HTTPS certs (create with mkcert or other tooling)
// Place files under ./certs/localhost-key.pem and ./certs/localhost.pem
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[dev-proxy] HTTP proxy listening on http://localhost:${PORT}`);
  console.log(`[dev-proxy] Forwarding /hc/* to https://support.snapmaker.com/hc/* with CORS for ${PREVIEW_ORIGIN}`);
});