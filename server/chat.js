// Chat completions via OpenRouter, plus the curated model list.
//
// Mounted at /api:  GET /api/models   (public — the picker needs it pre-login)
//                    POST /api/chat    (authenticated)

import { Router } from 'express';
import { requireAuth } from './auth.js';

const router = Router();

export const MODELS = [
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', note: 'Fast and affordable — default' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', note: 'OpenAI flagship model' },
  { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', note: 'Anthropic — strong reasoning' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', note: 'Fast Anthropic model' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', note: 'Google — quick responses' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', note: 'DeepSeek V3 chat' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1', note: 'DeepSeek reasoning model' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B', note: 'Meta open-weight model' },
  { id: 'x-ai/grok-2-1212', label: 'Grok 2', note: 'xAI model' },
  { id: 'mistralai/mistral-large', label: 'Mistral Large', note: 'Mistral AI flagship' },
  { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B', note: 'Alibaba open-weight model' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', note: 'Google — advanced reasoning' },
];

/** Default model id; read per-request so .env changes apply without a rebuild. */
export function getDefaultModel() {
  return process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini';
}

const SYSTEM_PROMPT =
  "You are Oja, a helpful AI assistant created by Dipesh. " +
  "Auto-detect the user's language from each message and always reply in that same language.";

/** GET /api/models — curated model list (array). */
router.get('/models', (req, res) => {
  res.json(MODELS);
});

/**
 * POST /api/chat { messages: [{ role, content }], model? }
 * Proxies to OpenRouter's chat completions endpoint.
 */
router.post('/chat', requireAuth, async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      code: 'NO_API_KEY',
      message: 'Add your OpenRouter API key to the .env file as OPENROUTER_API_KEY and restart the server.',
    });
  }

  const body = req.body ?? {};
  const messages = body.messages;
  const validMessages =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string');
  if (!validMessages) {
    return res
      .status(400)
      .json({ ok: false, code: 'INVALID_MESSAGES', message: 'messages must be a non-empty array of { role, content }.' });
  }

  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : getDefaultModel();

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Oja',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message = data?.error?.message || `OpenRouter returned HTTP ${upstream.status}.`;
      return res.status(502).json({ ok: false, code: 'UPSTREAM', message });
    }

    const text = data?.choices?.[0]?.message?.content ?? '';
    res.json({ ok: true, text, model: data?.model || model });
  } catch (err) {
    res.status(502).json({ ok: false, code: 'UPSTREAM', message: `Could not reach OpenRouter: ${err.message}` });
  }
});

export default router;
