#!/usr/bin/env node
/* Wildhand site + admin server. Zero dependencies — run with `node server.js`.
 *
 *   Serves the site statically, plus three endpoints used by /admin/:
 *     POST /api/login   { password }        -> { token }
 *     POST /api/save    (Bearer token)      -> writes content/content.json
 *     POST /api/upload  (Bearer token)      -> stores image, returns { url }
 *
 * Set ADMIN_PASSWORD in the environment for production; the default below is
 * for local testing only.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'wildhand';
const UPLOAD_DIR = path.join(ROOT, 'assets', 'uploads');
const CONTENT_FILE = path.join(ROOT, 'content', 'content.json');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_CONTENT_BYTES = 1 * 1024 * 1024;

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[warn] ADMIN_PASSWORD not set — using the default dev password "wildhand".');
}

const sessions = new Map(); // token -> expiry epoch ms

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-store' }, headers));
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function isAuthed(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) { sessions.delete(token); return false; }
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  try {
    /* ---------- API ---------- */
    if (url.pathname === '/api/login' && req.method === 'POST') {
      const body = await readBody(req, 4096);
      let password = '';
      try { password = JSON.parse(body.toString('utf8')).password || ''; } catch (_) {}
      const expected = Buffer.from(ADMIN_PASSWORD);
      const given = Buffer.from(String(password));
      const ok = expected.length === given.length && crypto.timingSafeEqual(expected, given);
      if (!ok) return sendJson(res, 401, { error: 'invalid password' });
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, Date.now() + SESSION_TTL_MS);
      return sendJson(res, 200, { token });
    }

    if (url.pathname === '/api/save' && req.method === 'POST') {
      if (!isAuthed(req)) return sendJson(res, 401, { error: 'unauthorized' });
      const body = await readBody(req, MAX_CONTENT_BYTES);
      let content;
      try { content = JSON.parse(body.toString('utf8')); } catch (_) {
        return sendJson(res, 400, { error: 'invalid JSON' });
      }
      if (typeof content !== 'object' || content === null || Array.isArray(content)) {
        return sendJson(res, 400, { error: 'content must be an object' });
      }
      fs.mkdirSync(path.dirname(CONTENT_FILE), { recursive: true });
      const tmp = CONTENT_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(content, null, 2) + '\n');
      fs.renameSync(tmp, CONTENT_FILE);
      return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === '/api/upload' && req.method === 'POST') {
      if (!isAuthed(req)) return sendJson(res, 401, { error: 'unauthorized' });
      const type = (req.headers['content-type'] || '').split(';')[0].trim();
      if (!type.startsWith('image/')) return sendJson(res, 415, { error: 'images only' });
      const body = await readBody(req, MAX_UPLOAD_BYTES);
      if (!body.length) return sendJson(res, 400, { error: 'empty upload' });
      const rawName = url.searchParams.get('name') || 'image';
      const base = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'image';
      const name = Date.now() + '-' + base;
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, name), body);
      return sendJson(res, 200, { url: 'assets/uploads/' + name });
    }

    if (url.pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'not found' });
    }

    /* ---------- Static files ---------- */
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'Method Not Allowed', { 'Content-Type': 'text/plain' });
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.normalize(path.join(ROOT, pathname));
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
      return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
    }

    let stat;
    try { stat = fs.statSync(filePath); } catch (_) {
      return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
    }
    if (stat.isDirectory()) {
      res.writeHead(301, { Location: url.pathname + '/' });
      return res.end();
    }

    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // content.json must never be cached, or admins publish into a stale view.
    if (filePath === CONTENT_FILE || ext === '.html' || ext === '.js') {
      headers['Cache-Control'] = 'no-store';
    } else {
      headers['Cache-Control'] = 'public, max-age=3600';
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    const status = err && err.message === 'too large' ? 413 : 500;
    if (!res.headersSent) sendJson(res, status, { error: status === 413 ? 'payload too large' : 'server error' });
  }
});

server.listen(PORT, () => {
  console.log('Wildhand site:  http://localhost:' + PORT + '/');
  console.log('Admin editor:   http://localhost:' + PORT + '/admin/');
});
