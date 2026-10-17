// Authentication for Oja: sessions (90-day sliding), phone OTP, email/password.
//
// Exports:
//   - router            Express router mounted at /api/auth
//   - requireAuth       middleware: 401 unless a valid session cookie is present
//   - getSessionUser    returns { id, email, phone, avatar } for the request's session, or null
//   - touchSession      extends near-expiry sessions (called inside requireAuth)

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db, nowIso } from './db.js';
import { requestCode, verifyCode } from './otp.js';
import { DEFAULT_AVATAR, isValidAvatar } from './avatar.js';

export const SESSION_COOKIE = 'oja_session';
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const REFRESH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // extend when < 30 days remain

/** Create a fresh session row and return its token. */
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return { token, expiresAt };
}

/** Set the session cookie (one-time login, persists 90 days). */
export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Look up the request's session cookie; prune expired sessions. */
export function getSessionUser(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (Date.now() > row.expires_at) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return db.prepare('SELECT id, email, phone, avatar FROM users WHERE id = ?').get(row.user_id) || null;
}

/**
 * Sliding session: if the current session expires within 30 days, extend it
 * to now + 90 days and re-set the cookie so the browser expiry matches.
 */
export function touchSession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row || Date.now() > row.expires_at) return;
  if (row.expires_at - Date.now() < REFRESH_WINDOW_MS) {
    db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').run(Date.now() + SESSION_TTL_MS, token);
    setSessionCookie(res, token);
  }
}

export function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Please sign in.' });
  }
  req.user = user;
  touchSession(req, res);
  next();
}

// --- validation helpers -----------------------------------------------------

function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && /^[+\d][\d\s\-().]{6,}$/.test(trimmed);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function publicUser(row) {
  // avatar falls back to the default so rows that predate the avatar
  // column still render a sensible profile picture on the client.
  return { id: row.id, email: row.email, phone: row.phone, avatar: row.avatar || DEFAULT_AVATAR };
}

// --- routes -----------------------------------------------------------------

const router = Router();

/** GET /api/auth/me — current session user (401 when signed out). */
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

/** PUT /api/auth/profile { avatar } — change the signed-in user's avatar. */
router.put('/profile', requireAuth, (req, res) => {
  const avatar = String(req.body?.avatar ?? '').trim();
  if (!isValidAvatar(avatar)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_AVATAR',
      message: 'Choose a valid avatar.',
    });
  }
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  const user = db.prepare('SELECT id, email, phone, avatar FROM users WHERE id = ?').get(req.user.id);
  res.json({ ok: true, user: publicUser(user) });
});

/** POST /api/auth/phone/request { phone } — issue an OTP code. */
router.post('/phone/request', (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  if (!isValidPhone(phone)) {
    return res.status(400).json({ ok: false, code: 'INVALID_PHONE', message: 'Enter a valid phone number.' });
  }
  // Rate limiting is enforced by the OTP module: codes expire after
  // 10 minutes and verification allows at most 5 attempts per code.
  const { code, demo } = requestCode(phone);
  if (demo) {
    return res.json({ ok: true, demo: true, demo_code: code });
  }
  res.json({ ok: true, demo: false });
});

/** POST /api/auth/phone/verify { phone, code } — verify OTP, sign in. */
router.post('/phone/verify', (req, res) => {
  const phone = String(req.body?.phone ?? '').trim();
  const code = String(req.body?.code ?? '').trim();
  const result = verifyCode(phone, code);

  if (!result.ok) {
    const messages = {
      not_found: 'No code was requested for this number.',
      expired: 'This code has expired. Request a new one.',
      too_many_attempts: 'Too many attempts. Request a new code.',
      mismatch: 'Incorrect code.',
    };
    return res.status(400).json({
      ok: false,
      code: 'OTP_' + String(result.reason).toUpperCase(),
      message: messages[result.reason] || 'Verification failed.',
    });
  }

  let user = db.prepare('SELECT id, email, phone, avatar FROM users WHERE phone = ?').get(phone);
  if (!user) {
    const info = db.prepare('INSERT INTO users (phone, created_at) VALUES (?, ?)').run(phone, nowIso());
    user = db.prepare('SELECT id, email, phone, avatar FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  const { token } = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ ok: true, user: publicUser(user) });
});

/** POST /api/auth/register { email, password } — email signup. */
router.post('/register', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ ok: false, code: 'EMAIL_TAKEN', message: 'This email is already registered.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
    .run(email, password_hash, nowIso());
  const user = db.prepare('SELECT id, email, phone, avatar FROM users WHERE id = ?').get(info.lastInsertRowid);

  const { token } = createSession(user.id);
  setSessionCookie(res, token);
  res.status(201).json({ ok: true, user: publicUser(user) });
});

/** POST /api/auth/login { email, password } — email sign in. */
router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const valid = user?.password_hash ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !valid) {
    // Same response whether or not the email exists (no user enumeration).
    return res.status(401).json({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });
  }

  const { token } = createSession(user.id);
  setSessionCookie(res, token);
  res.json({ ok: true, user: publicUser(user) });
});

/** POST /api/auth/logout — end this session. */
router.post('/logout', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

export default router;
