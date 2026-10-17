// Thin fetch wrappers over the Oja backend JSON API (same origin).
// Every request sends credentials:'include' so the session cookie travels.

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function req(path, opts = {}) {
  const res = await fetch(path, { credentials: 'include', ...opts });
  const data = await parseJson(res);
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const get = (path) => req(path);

const postJson = (path, body) =>
  req(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

const putJson = (path, body) =>
  req(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

// --- misc ---
export const health = () => get('/api/health');
export const getModels = () => get('/api/models');
export const postChat = (messages, model) => postJson('/api/chat', { messages, model });

// --- auth ---
export const me = () => get('/api/auth/me');
export const phoneRequest = (phone) => postJson('/api/auth/phone/request', { phone });
export const phoneVerify = (phone, code) => postJson('/api/auth/phone/verify', { phone, code });
export const register = (email, password) => postJson('/api/auth/register', { email, password });
export const login = (email, password) => postJson('/api/auth/login', { email, password });
export const logout = () => postJson('/api/auth/logout');
export const updateAvatar = (avatar) => putJson('/api/auth/profile', { avatar });

// --- chats ---
export const listChats = () => get('/api/chats');
export const createChat = (title) => postJson('/api/chats', { title });
export const renameChat = (id, title) =>
  req(`/api/chats/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
export const deleteChat = (id) =>
  req(`/api/chats/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getMessages = (id) => get(`/api/chats/${encodeURIComponent(id)}/messages`);
export const saveMessage = (id, { role, content, model }) =>
  postJson(`/api/chats/${encodeURIComponent(id)}/messages`, { role, content, model });

// --- media library ---
export const listMedia = () => get('/api/media');
export async function uploadMedia(files) {
  const fd = new FormData();
  for (const f of files) fd.append('file', f);
  // NOTE: no Content-Type header — the browser sets the multipart boundary.
  return req('/api/media', { method: 'POST', body: fd });
}
export const deleteMedia = (id) =>
  req(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const mediaFileUrl = (id) => `/api/media/file/${encodeURIComponent(id)}`;

// --- settings ---
export const getSettings = () => get('/api/settings');
export const saveSettings = (settings) =>
  req('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });

// --- donate ---
export const getDonate = () => get('/api/donate');
