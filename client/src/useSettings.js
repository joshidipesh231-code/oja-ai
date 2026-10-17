import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, saveSettings } from './api.js';

/*
 * SETTINGS PERSISTENCE CHOICE
 * ---------------------------
 * When the user is logged in, settings sync to the server via GET/PUT
 * /api/settings, so they follow the user across devices. When logged out,
 * settings persist locally in localStorage under 'oja-settings' (per-device
 * fallback). Every change is applied immediately to <html> via data
 * attributes (data-theme, data-font, data-width, data-accent, data-textsize,
 * data-motion) plus the --chat-text-size CSS variable, so the UI updates
 * without a reload.
 */
export const DEFAULT_SETTINGS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  font: 'serif', // 'serif' | 'sans' | 'mono'
  width: 'standard', // 'narrow' | 'standard' | 'wide'
  reduceMotion: false,
  voiceLang: 'auto', // 'auto' or BCP-47 prefix like 'en'
  voiceStyle: 'natural', // reserved for future TTS voice selection
  voiceSpeed: 1, // speechSynthesis rate
  accent: 'green', // 'green' | 'teal' | 'blue' | 'purple'
  textSize: 'medium', // 'small' | 'medium' | 'large'
  showAd: true,
};

const LOCAL_KEY = 'oja-settings';
const TEXT_SIZES = { small: '14px', medium: '16px', large: '18px' };

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(s) {
  const html = document.documentElement;
  html.dataset.theme = resolveTheme(s.theme);
  html.dataset.font = s.font;
  html.dataset.width = s.width;
  html.dataset.accent = s.accent;
  html.dataset.textsize = s.textSize;
  html.dataset.motion = s.reduceMotion ? 'reduce' : 'full';
  html.style.setProperty('--chat-text-size', TEXT_SIZES[s.textSize] || TEXT_SIZES.medium);
}

export default function useSettings(user) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const ref = useRef(DEFAULT_SETTINGS);
  const userRef = useRef(user);
  userRef.current = user;

  const commit = useCallback((next) => {
    ref.current = next;
    setSettings(next);
    apply(next);
  }, []);

  // Load: server copy when logged in, localStorage when logged out.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let merged = { ...DEFAULT_SETTINGS, ...readLocal() };
      if (user) {
        try {
          const d = await getSettings();
          const server = d.settings || d || {};
          merged = { ...DEFAULT_SETTINGS, ...server };
        } catch {
          /* fall back to local copy */
        }
      }
      if (!cancelled) commit(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, commit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep 'system' theme in sync with the OS while it is selected.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (ref.current.theme === 'system') apply(ref.current);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const update = useCallback(
    async (patch) => {
      const next = { ...ref.current, ...patch };
      commit(next);
      try {
        if (userRef.current) {
          await saveSettings(next);
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        }
      } catch {
        /* persistence failure is non-fatal; UI already updated */
      }
    },
    [commit]
  );

  return [settings, update];
}
