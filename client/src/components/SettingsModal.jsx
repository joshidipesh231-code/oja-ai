import { useState } from 'react';
import { updateAvatar } from '../api.js';
import { AvatarPicker } from './Avatars.jsx';

const THEMES = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
];
const FONTS = [
  ['serif', 'Serif'],
  ['sans', 'Sans'],
  ['mono', 'Mono'],
];
const WIDTHS = [
  ['narrow', 'Narrow'],
  ['standard', 'Standard'],
  ['wide', 'Wide'],
];
const TEXT_SIZES = [
  ['small', 'Small'],
  ['medium', 'Medium'],
  ['large', 'Large'],
];
const ACCENTS = [
  ['green', 'Green'],
  ['teal', 'Teal'],
  ['blue', 'Blue'],
  ['purple', 'Purple'],
];
const VOICE_LANGS = [
  ['auto', 'Auto'],
  ['en', 'English'],
  ['ne', 'Nepali'],
  ['hi', 'Hindi'],
  ['es', 'Spanish'],
  ['fr', 'French'],
];

function Row({ label, hint, children }) {
  return (
    <div className="set-row">
      <div>
        <div className="set-label">{label}</div>
        {hint && <div className="set-hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsModal({ settings, onChange, onClose, user, onUser }) {
  const sel = (key) => (e) => onChange({ [key]: e.target.value });
  const [avatarError, setAvatarError] = useState('');
  const [savingAvatar, setSavingAvatar] = useState(false);

  const pickAvatar = async (id) => {
    if (!user || id === user.avatar || savingAvatar) return;
    setSavingAvatar(true);
    setAvatarError('');
    try {
      const d = await updateAvatar(id);
      onUser?.(d.user);
    } catch (e) {
      setAvatarError(e.message);
    } finally {
      setSavingAvatar(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        {user && (
          <>
            <h3 className="set-section">Profile</h3>
            <p className="muted small set-profile-hint">
              Your avatar appears next to your name in the sidebar.
            </p>
            <AvatarPicker value={user.avatar} onPick={pickAvatar} />
            {avatarError && (
              <p className="form-error" role="alert">
                {avatarError}
              </p>
            )}
          </>
        )}

        <Row label="Theme" hint="System follows your device's light/dark mode.">
          <select className="field" value={settings.theme} onChange={sel('theme')}>
            {THEMES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Chat font">
          <select className="field" value={settings.font} onChange={sel('font')}>
            {FONTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Transcript width">
          <select className="field" value={settings.width} onChange={sel('width')}>
            {WIDTHS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Text size">
          <select className="field" value={settings.textSize} onChange={sel('textSize')}>
            {TEXT_SIZES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Accent color">
          <select className="field" value={settings.accent} onChange={sel('accent')}>
            {ACCENTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Reduce motion" hint="Disables animations and transitions.">
          <input
            type="checkbox"
            className="switch"
            checked={!!settings.reduceMotion}
            onChange={(e) => onChange({ reduceMotion: e.target.checked })}
            aria-label="Reduce motion"
          />
        </Row>

        <Row label="Show house ad" hint="The small image-only ad slot in the sidebar.">
          <input
            type="checkbox"
            className="switch"
            checked={settings.showAd !== false}
            onChange={(e) => onChange({ showAd: e.target.checked })}
            aria-label="Show house ad"
          />
        </Row>

        <h3 className="set-section">Voice</h3>

        <Row label="Voice language" hint="Used for read-aloud and voice input.">
          <select className="field" value={settings.voiceLang} onChange={sel('voiceLang')}>
            {VOICE_LANGS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Voice style">
          <select className="field" value={settings.voiceStyle} onChange={sel('voiceStyle')}>
            <option value="natural">Natural</option>
            <option value="clear">Clear</option>
          </select>
        </Row>

        <Row label={`Voice speed · ${Number(settings.voiceSpeed).toFixed(1)}×`}>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.voiceSpeed}
            onChange={(e) => onChange({ voiceSpeed: Number(e.target.value) })}
            aria-label="Voice speed"
          />
        </Row>
      </div>
    </div>
  );
}
