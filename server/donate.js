// Donate panel config. Public endpoint (no login required) — it only
// exposes the display methods defined in donate.config.js. No charging,
// no fake links. Mounted at /api/donate.

import { Router } from 'express';
import { DONATION_METHODS } from './donate.config.js';

const router = Router();

/** GET /api/donate — { methods: [{ id, label, note, details }] }. */
router.get('/', (req, res) => {
  res.json({ ok: true, methods: DONATION_METHODS });
});

export default router;
