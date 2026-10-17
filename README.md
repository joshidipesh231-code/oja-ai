# Oja

Oja is an AI chatbot web app by **Dipesh Joshi**, powered by [OpenRouter](https://openrouter.ai/). Chat with many models through one interface — with voice input, chat history, cloud file storage, Claude-style settings, and a mobile-friendly PWA install.

## Features

- **Chat** with a model picker (switch OpenRouter models per conversation) + voice input (Web Speech API)
- **Sidebar history** — per-user conversation list, rename, delete, new chat
- **Login via phone or email OTP** with 90-day persistent sessions ("remember me" style; one-time login)
- **5GB cloud storage** per user (upload files, attach to chats)
- **Claude-style Settings** — theme (light/dark/system), chat font, transcript width, motion/reduced-motion, voice language / style / speed
- **Donate panel** — shows the creator's photo with payment options (eSewa, PayPal, UPI, bank cards)
- **About me card** — Dipesh Joshi's photo, Instagram @dip_esh1230, contact email
- **Image-only ad slot** in the left sidebar — never redirects on tap
- **Multilingual auto-detect** — UI/chat adapts to the detected language

## Quickstart

```bash
npm install
cp .env.example .env
# edit .env — paste your OPENROUTER_API_KEY from https://openrouter.ai/keys
npm run dev
```

App runs at **http://localhost:3000**.

Production:

```bash
npm run build && npm start
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `3000` | Port the server listens on |
| `OPENROUTER_API_KEY` | **yes** | — | API key from https://openrouter.ai/keys |
| `OPENROUTER_DEFAULT_MODEL` | no | set in `server/config.js` | Default chat model id |
| `SESSION_SECRET` | **yes (prod)** | — | Random string for signing sessions. **Must be random in production** |
| `OTP_DEMO_MODE` | no | `true` | `true` shows the OTP code in the UI (dev only). **Must be `false` in production** |
| `DATA_DIR` | no | `./data` | SQLite database directory |
| `UPLOAD_DIR` | no | `./uploads` | User file uploads directory |
| `QUOTA_BYTES` | no | `5368709120` | Per-user storage quota (5 GB) |

## Deploy

### Render
1. New → Web Service → connect this repo.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add env vars (`OPENROUTER_API_KEY`, `SESSION_SECRET`, `OTP_DEMO_MODE=false`, …).
5. Add a persistent disk mounted at the `DATA_DIR`/`UPLOAD_DIR` paths so SQLite data and uploads survive deploys.

### Railway
1. New project → deploy from repo.
2. Set the same env vars. Railway gives you a persistent volume — point `DATA_DIR`/`UPLOAD_DIR` at it (or keep defaults if the service has a volume at the working dir).

### Plain VPS (pm2 + nginx)
```bash
# on the server
git clone <your-repo-url> oja && cd oja
npm install && npm run build
# .env with production values (OTP_DEMO_MODE=false, random SESSION_SECRET)
pm2 start npm --name oja -- start
pm2 save && pm2 startup
```
nginx sketch:
```nginx
server {
    listen 80;
    server_name oja.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
Add TLS (certbot) for production.

> **Note:** Vercel/Netlify need adaptation. Oja uses SQLite + local file uploads, which don't fit serverless. Use a VPS, Render, or Railway instead.

## GitHub push

```bash
git init -b main
git add .
git commit -m "Initial commit: Oja AI chatbot"
gh repo create oja --public --source=. --push
```

Or without the GitHub CLI:

```bash
# create the repo on github.com first, then:
git remote add origin https://github.com/<you>/oja.git
git push -u origin main
```

## Android wrap

Two paths:

**PWA path (recommended first step)** — the app already ships a web manifest + service worker, so it's installable: open it in Chrome on Android → ⋮ menu → "Add to Home screen" / "Install app".

**Capacitor path (real APK):**
```bash
npm i @capacitor/core @capacitor/cli
npx cap init
npx cap add android
# set webDir to the client build output (dist) in capacitor.config
npm run build
npx cap sync android
```
Open the `android/` project in Android Studio and build the APK/AAB. See `MOBILE.md` for details.

## PC wrap

- **PWA install:** open the deployed app in Chrome/Edge → install icon in the address bar → standalone desktop app.
- **Electron/Tauri wrapper:** point the wrapper at the production web build (`dist`) for an offline-capable desktop app. See `MOBILE.md` for steps.

## Where to plug things in

- **Real SMS/email OTP provider:** `server/otp.js` — there's a comment block marking exactly where to send codes via Twilio/MSG91/SES/etc.
- **Donate details:** `server/donate.config.js` — add your eSewa/PayPal/UPI/card details there.
- **Real ad images:** replace the placeholder in `client/src/components/AdSlot.jsx`. Ads are image-only by design and never redirect on tap.

## ⚠️ SECURITY — read before real users

- **OTP demo mode shows the code in the UI** (`OTP_DEMO_MODE=true`). This is for development only. It **MUST** be replaced with a real SMS/email provider (see `server/otp.js`) before real users sign up.
- **Never commit `.env`.** It holds `OPENROUTER_API_KEY` and `SESSION_SECRET`. The `.gitignore` already excludes it.
- **`SESSION_SECRET` must be random in production** — generate with `openssl rand -hex 32` or similar. A leaked/predictable secret lets attackers forge sessions.

## Settings persistence

- **Logged in:** settings are stored per-user on the server and follow the account across devices.
- **Logged out:** settings fall back to `localStorage` on the current device only.
