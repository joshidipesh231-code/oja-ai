// Media uploads: images/videos stored on disk under UPLOAD_DIR, metadata in
// SQLite. Per-user quota enforced against QUOTA_BYTES. All routes require
// auth and enforce ownership. Mounted at /api/media.

import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { db, nowIso } from './db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const QUOTA_BYTES = Number(process.env.QUOTA_BYTES || 5368709120); // 5 GB default
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Random hex name keeps originals private and avoids collisions.
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      return cb(null, true);
    }
    cb(new Error('Only image and video uploads are allowed.'));
  },
});

function publicFile(row) {
  return {
    id: row.id,
    filename: row.filename,
    mime: row.mime,
    size: row.size,
    url: '/api/media/file/' + row.id,
    created_at: row.created_at,
  };
}

/** Fetch a media row only if it belongs to this user. */
function getFile(id, userId) {
  return db.prepare('SELECT * FROM media WHERE id = ? AND user_id = ?').get(id, userId);
}

function usedBytes(userId) {
  return db.prepare('SELECT COALESCE(SUM(size), 0) AS s FROM media WHERE user_id = ?').get(userId).s;
}

/** POST /api/media — upload one file (multipart field name: 'file'). */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, code: 'NO_FILE', message: "Attach a file in the 'file' field." });
    }

    // Quota is checked after multer writes to disk; over-quota files are
    // removed immediately so they don't linger.
    if (usedBytes(req.user.id) + req.file.size > QUOTA_BYTES) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(413).json({ ok: false, code: 'QUOTA', message: 'Storage quota exceeded.' });
    }

    const info = db
      .prepare('INSERT INTO media (user_id, filename, stored_name, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, nowIso());
    const row = db.prepare('SELECT * FROM media WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ ok: true, file: publicFile(row) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/media — list files + quota usage. */
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM media WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  res.json({
    ok: true,
    files: rows.map(publicFile),
    used_bytes: rows.reduce((sum, r) => sum + r.size, 0),
    limit_bytes: QUOTA_BYTES,
  });
});

/** GET /api/media/file/:id — download/stream a file (ownership checked). */
router.get('/file/:id', (req, res) => {
  const row = getFile(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'File not found.' });

  res.type(row.mime);
  res.sendFile(path.join(UPLOAD_DIR, row.stored_name), (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'File is missing from disk.' });
    }
  });
});

/** DELETE /api/media/:id — delete file + metadata (ownership checked). */
router.delete('/:id', async (req, res, next) => {
  try {
    const row = getFile(req.params.id, req.user.id);
    if (!row) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'File not found.' });

    await fs.promises.unlink(path.join(UPLOAD_DIR, row.stored_name)).catch((err) => {
      if (err.code !== 'ENOENT') throw err; // missing file is fine; real errors propagate
    });
    db.prepare('DELETE FROM media WHERE id = ?').run(row.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Multer / upload errors → clean JSON. Must be registered after the routes.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ ok: false, code: 'FILE_TOO_LARGE', message: 'File exceeds the 25 MB upload limit.' });
    }
    return res.status(400).json({ ok: false, code: 'UPLOAD_ERROR', message: err.message });
  }
  if (err) {
    return res.status(400).json({ ok: false, code: 'UPLOAD_ERROR', message: err.message || 'Upload failed.' });
  }
  next();
});

export default router;
