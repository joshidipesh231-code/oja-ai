import { useState } from 'react';
import { login, register, phoneRequest, phoneVerify, updateAvatar } from '../api.js';
import { AvatarPicker } from './Avatars.jsx';

function PhonePane({ onAuth }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('number'); // 'number' | 'code'
  const [demoCode, setDemoCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const request = async () => {
    const p = phone.trim();
    if (!p) {
      setError('Enter your phone number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const d = await phoneRequest(p);
      setDemoCode(d.demo_code || '');
      setStep('code');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (code.trim().length < 4) {
      setError('Enter the verification code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const d = await phoneVerify(phone.trim(), code.trim());
      onAuth(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-pane">
      {step === 'number' ? (
        <>
          <label className="field-label" htmlFor="login-phone">
            Phone number
          </label>
          <input
            id="login-phone"
            className="field field-block"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+977 98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && request()}
          />
          <button className="btn btn-primary btn-block" onClick={request} disabled={busy}>
            {busy ? 'Sending…' : 'Send code'}
          </button>
        </>
      ) : (
        <>
          <p className="muted small">
            Code sent to <strong>{phone.trim()}</strong>.{' '}
            <button className="link-btn" onClick={() => setStep('number')}>
              Change
            </button>
          </p>
          {demoCode && (
            <div className="demo-code-box" role="status">
              <span className="demo-code-label">DEMO CODE — remove before production</span>
              <span className="demo-code-value">{demoCode}</span>
            </div>
          )}
          <label className="field-label" htmlFor="login-code">
            6-digit code
          </label>
          <input
            id="login-code"
            className="field field-block code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
          />
          <button className="btn btn-primary btn-block" onClick={verify} disabled={busy}>
            {busy ? 'Verifying…' : 'Verify'}
          </button>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function EmailPane({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const d = mode === 'login' ? await login(email.trim(), password) : await register(email.trim(), password);
      onAuth(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-pane">
      <div className="segmented" role="tablist" aria-label="Email mode">
        {['login', 'register'].map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={`segment${mode === m ? ' active' : ''}`}
            onClick={() => {
              setMode(m);
              setError('');
            }}
          >
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        className="field field-block"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label className="field-label" htmlFor="login-password">
        Password
      </label>
      <input
        id="login-password"
        className="field field-block"
        type="password"
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function LoginModal({ onClose, onAuth }) {
  const [tab, setTab] = useState('phone'); // 'phone' | 'email'
  // After a successful sign-in we pause on a "Pick your avatar" step before
  // calling onAuth. Dismissing the modal at that point counts as skipping.
  const [pendingUser, setPendingUser] = useState(null);
  const [avatarId, setAvatarId] = useState('fox');
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const authed = (u) => {
    setAvatarId(u?.avatar || 'fox');
    setPendingUser(u);
  };

  const finish = (u) => {
    setPendingUser(null);
    onAuth(u);
  };

  const saveAndFinish = async () => {
    if (!pendingUser) return;
    if (avatarId === pendingUser.avatar) {
      finish(pendingUser);
      return;
    }
    setSaving(true);
    setAvatarError('');
    try {
      const d = await updateAvatar(avatarId);
      finish(d.user || { ...pendingUser, avatar: avatarId });
    } catch (e) {
      setAvatarError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (pendingUser) {
    return (
      <div className="modal-backdrop" onClick={() => finish(pendingUser)} role="presentation">
        <div
          className="modal modal-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pick your avatar"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head">
            <h2>Pick your avatar</h2>
            <button
              className="icon-btn"
              onClick={() => finish(pendingUser)}
              aria-label="Skip avatar picker"
            >
              ✕
            </button>
          </div>
          <p className="muted small">
            This shows next to your name. You can change it anytime in Settings.
          </p>
          <AvatarPicker value={avatarId} onPick={setAvatarId} />
          {avatarError && (
            <p className="form-error" role="alert">
              {avatarError}
            </p>
          )}
          <div className="avatar-step-actions">
            <button className="btn btn-ghost" onClick={() => finish(pendingUser)}>
              Skip for now
            </button>
            <button className="btn btn-primary" onClick={saveAndFinish} disabled={saving}>
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Log in to Oja"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Log in to Oja</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close login">
            ✕
          </button>
        </div>
        <div className="segmented" role="tablist" aria-label="Login method">
          {['phone', 'email'].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`segment${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'phone' ? 'Phone' : 'Email'}
            </button>
          ))}
        </div>
        {tab === 'phone' ? <PhonePane onAuth={authed} /> : <EmailPane onAuth={authed} />}
        <p className="muted small center">You need an account to chat with Oja.</p>
      </div>
    </div>
  );
}
