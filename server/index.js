// Oja backend entrypoint.
//
// Loads env, wires middleware + routers, serves the built frontend (dist/)
// with an SPA fallback, then listens on PORT.
//
// The frontend is built by `npm run build` (client/vite.config.js) into
// <repo>/dist. The API lives under /api/.

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import first so tables are created before any request arrives.
import './db.js';

import authRouter from './auth.js';
import chatRouter from './chat.js';
import chatsRouter from './chats.js';
import mediaRouter from './media.js';
import settingsRouter from './settings.js';
import donateRouter from './donate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const hasDist = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// --- API routes -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRouter); // /api/auth/me, /phone/request, /phone/verify, /register, /login, /logout
app.use('/api/chats', chatsRouter); // /api/chats, /api/chats/:id, /:id/messages
app.use('/api/media', mediaRouter); // /api/media, /api/media/file/:id
app.use('/api/settings', settingsRouter); // /api/settings
app.use('/api/donate', donateRouter); // /api/donate
app.use('/api', chatRouter); // GET /api/models, POST /api/chat

// Unknown /api route → JSON 404 (kept ahead of the SPA fallback so API
// 404s are never answered with index.html).
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Unknown API endpoint.' });
});

// --- Frontend ---------------------------------------------------------------
if (hasDist) {
  app.use(express.static(DIST_DIR));
}

// SPA fallback: any non-API GET serves the app shell. If the frontend was
// never built, answer with a plain-text hint instead of a confusing 404.
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
  if (hasDist) return res.sendFile(path.join(DIST_DIR, 'index.html'));
  return res
    .type('text/plain')
    .send('Oja API is running, but the frontend has not been built yet.\nRun `npm run build` first, then restart the server.');
});

// --- Boot -------------------------------------------------------------------
const PORT = Number(process.env.PORT || 3000);
const demoMode = (process.env.OTP_DEMO_MODE ?? 'true') === 'true';

app.listen(PORT, () => {
  console.log(`[oja] listening on http://localhost:${PORT}`);
  console.log(
    `[oja] OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'set' : 'NOT SET — chat completions will return 503'}`
  );
  console.log(
    `[oja] OTP_DEMO_MODE: ${demoMode}${demoMode ? ' (OTP codes are returned in API responses — see server/otp.js before production)' : ''}`
  );
  console.log(`[oja] DATA_DIR: ${path.resolve(process.env.DATA_DIR || './data')}`);
  console.log(`[oja] UPLOAD_DIR: ${path.resolve(process.env.UPLOAD_DIR || './uploads')}`);
  console.log(`[oja] frontend: ${hasDist ? 'serving dist/' : 'not built — run `npm run build`'}`);
});
