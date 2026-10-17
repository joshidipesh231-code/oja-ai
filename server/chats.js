// Chat history: list/create/rename/delete chats and read/append messages.
// All routes require auth and are scoped to the signed-in user (ownership
// checks on every per-chat route). Mounted at /api/chats.

import { Router } from 'express';
import { db, nowIso } from './db.js';
import { requireAuth } from './auth.js';

const router = Router();
router.use(requireAuth);

const DEFAULT_TITLE = 'New chat';

/** Fetch a chat only if it belongs to this user. */
function getChat(id, userId) {
  return db.prepare('SELECT * FROM chats WHERE id = ? AND user_id = ?').get(id, userId);
}

function chatSummary(chat) {
  return { id: chat.id, title: chat.title, model: chat.model, created_at: chat.created_at, updated_at: chat.updated_at };
}

/** GET /api/chats — list the user's chats, newest first. */
router.get('/', (req, res) => {
  const chats = db
    .prepare('SELECT id, title, model, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id);
  res.json({ ok: true, chats });
});

/** POST /api/chats { title?, model? } — create a chat. */
router.post('/', (req, res) => {
  const body = req.body ?? {};
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  const title = rawTitle ? rawTitle.slice(0, 120) : DEFAULT_TITLE;
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : null;
  const now = nowIso();
  const info = db
    .prepare('INSERT INTO chats (user_id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, model, now, now);
  const chat = db.prepare('SELECT * FROM chats WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ok: true, chat: chatSummary(chat) });
});

/** PATCH /api/chats/:id { title } — rename a chat. */
router.patch('/:id', (req, res) => {
  const chat = getChat(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Chat not found.' });

  const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!rawTitle) {
    return res.status(400).json({ ok: false, code: 'INVALID_TITLE', message: 'Title must be a non-empty string.' });
  }
  const title = rawTitle.slice(0, 120);
  const now = nowIso();
  db.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?').run(title, now, chat.id);
  res.json({ ok: true, chat: chatSummary({ ...chat, title, updated_at: now }) });
});

/** DELETE /api/chats/:id — delete a chat and all of its messages. */
router.delete('/:id', (req, res) => {
  const chat = getChat(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Chat not found.' });

  db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chat.id);
  db.prepare('DELETE FROM chats WHERE id = ?').run(chat.id);
  res.json({ ok: true });
});

/** GET /api/chats/:id/messages — full message history, oldest first. */
router.get('/:id/messages', (req, res) => {
  const chat = getChat(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Chat not found.' });

  const messages = db
    .prepare('SELECT id, role, content, model, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC')
    .all(chat.id);
  res.json({ ok: true, messages });
});

/**
 * POST /api/chats/:id/messages { role: 'user'|'assistant', content, model? }
 * Appends a message. If it's a user message and the chat still has the
 * default title, the chat is auto-titled from the first 40 chars of content.
 */
router.post('/:id/messages', (req, res) => {
  const chat = getChat(req.params.id, req.user.id);
  if (!chat) return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Chat not found.' });

  const body = req.body ?? {};
  const { role, content } = body;
  const model = typeof body.model === 'string' ? body.model : null;

  if (role !== 'user' && role !== 'assistant') {
    return res.status(400).json({ ok: false, code: 'INVALID_ROLE', message: "role must be 'user' or 'assistant'." });
  }
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ ok: false, code: 'INVALID_CONTENT', message: 'content must be a non-empty string.' });
  }

  const now = nowIso();
  const info = db
    .prepare('INSERT INTO messages (chat_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(chat.id, role, content, model, now);

  let title = chat.title;
  if (role === 'user' && title === DEFAULT_TITLE) {
    title = content.trim().slice(0, 40) || DEFAULT_TITLE;
    db.prepare('UPDATE chats SET title = ?, updated_at = ? WHERE id = ?').run(title, now, chat.id);
  } else {
    db.prepare('UPDATE chats SET updated_at = ? WHERE id = ?').run(now, chat.id);
  }

  const message = db
    .prepare('SELECT id, role, content, model, created_at FROM messages WHERE id = ?')
    .get(info.lastInsertRowid);
  res.status(201).json({ ok: true, message, title });
});

export default router;
