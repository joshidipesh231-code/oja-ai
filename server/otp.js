/**
 * ============================================================================
 * OTP DELIVERY — READ BEFORE GOING TO PRODUCTION
 * ============================================================================
 *
 * PRODUCTION: plug a real SMS provider here (Twilio, AWS SNS, Vonage, etc.).
 * The right place is inside requestCode(), in the `if (!demo)` branch below:
 * call your provider's "send SMS" API there with the generated `code`.
 *
 * RULES:
 *   - NEVER log OTP codes (not to console, files, or error trackers).
 *   - Set OTP_DEMO_MODE=false in your production .env.
 *   - When demo is false, the auth router must NOT include `demo_code` in
 *     API responses (server/auth.js already omits it in that case — keep it
 *     that way).
 *   - Codes expire after 10 minutes and are limited to 5 verification
 *     attempts; both are enforced in verifyCode() regardless of provider.
 *
 * Until then, OTP_DEMO_MODE=true returns the code in the API response so you
 * can sign in during development without an SMS provider.
 * ============================================================================
 */

import crypto from 'node:crypto';
import { db, nowMs } from './db.js';

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/** Generate a cryptographically random 6-digit code, as a zero-padded string. */
export function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Issue (and, in production, send) a one-time code for `phone`.
 * Upserts: requesting again replaces the previous code and resets attempts.
 * Returns { code, demo } where `demo` is true when OTP_DEMO_MODE === 'true'.
 */
export function requestCode(phone) {
  const code = generateCode();
  const expiresAt = nowMs() + CODE_TTL_MS;

  db.prepare(
    `INSERT INTO otps (phone, code, expires_at, attempts)
     VALUES (?, ?, ?, 0)
     ON CONFLICT(phone) DO UPDATE
       SET code = excluded.code,
           expires_at = excluded.expires_at,
           attempts = 0`
  ).run(phone, code, expiresAt);

  const demo = (process.env.OTP_DEMO_MODE ?? 'true') === 'true';

  if (!demo) {
    // PRODUCTION: send `code` via your SMS provider here.
    // Example shape (do NOT copy verbatim — wire up your real provider):
    //   await smsProvider.send({ to: phone, body: `Your Oja code is ${code}` });
    // NEVER console.log / persist the code.
  }

  return { code, demo };
}

/**
 * Verify a submitted code. Returns { ok: true } on success, otherwise
 * { ok: false, reason } where reason is one of:
 * 'not_found' | 'expired' | 'too_many_attempts' | 'mismatch'.
 *
 * Attempts are incremented before comparison (brute-force rate limit) and a
 * successful verification deletes the code so it can't be reused.
 */
export function verifyCode(phone, code) {
  const row = db.prepare('SELECT * FROM otps WHERE phone = ?').get(phone);
  if (!row) return { ok: false, reason: 'not_found' };

  if (nowMs() > row.expires_at) {
    db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);
    return { ok: false, reason: 'expired' };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: 'too_many_attempts' };
  }

  // Count the attempt before comparing so failures burn an attempt.
  db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?').run(phone);

  // Timing-safe comparison — avoids leaking code bytes via timing.
  const submitted = Buffer.from(String(code));
  const expected = Buffer.from(String(row.code));
  const match = submitted.length === expected.length && crypto.timingSafeEqual(submitted, expected);

  if (!match) return { ok: false, reason: 'mismatch' };

  db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);
  return { ok: true };
}
