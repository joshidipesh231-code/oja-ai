// Per-user settings: a free-form JSON object (theme, chat font, transcript
// width, motion, voice language/style/speed, …). Stored as JSON in
// user_settings. Mounted at /api/settings.

import { Router } from 'express';
import { db } from './db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

function readSettings(userId) {
  const row = db.prepare('SELECT data FROM user_settings WHERE user_id = ?').get(userId);
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {}; // tolerate corrupt rows rather than 500ing
  }
}

/** GET /api/settings — stored settings JSON, or {} when none saved yet. */
router.get('/', (req, res) => {
  res.json({ ok: true, settings: readSettings(req.user.id) });
});

/** PUT /api/settings { settings: {...} } — upsert the settings object. */
router.put('/', (req, res) => {
  const settings = req.body?.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return res.status(400).json({ ok: false, code: 'INVALID_SETTINGS', message: 'settings must be a JSON object.' });
  }

  db.prepare(
    `INSERT INTO user_settings (user_id, data) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data`
  ).run(req.user.id, JSON.stringify(settings));

  res.json({ ok: true, settings });
});

export default router;
