# Oja on Mobile & Desktop

Practical guide for wrapping the Oja web app for phones and PCs.

## PWA (do this first)

The app already ships what's needed: a web manifest and a service worker.

**What's included**
- `manifest` (name, icons, theme colors, display: standalone) — makes it installable.
- Service worker — caches the app shell for offline/fast loads.

**Test installability**
1. `npm run build && npm start`, open the production URL in Chrome.
2. DevTools → Lighthouse → check the **PWA** category. Fix anything red (maskable icon, HTTPS, etc.).
3. On Android Chrome: ⋮ menu → "Install app" / "Add to Home screen".
4. On desktop Chrome/Edge: install icon in the address bar.

This is the cheapest path to "an app" and needs no store.

## Capacitor → Android APK/AAB (step-by-step)

```bash
npm i @capacitor/core @capacitor/cli
npx cap init Oja com.dipeshjoshi.oja
npx cap add android
```

1. In `capacitor.config.ts` set `webDir: 'dist'` (the client build output).
2. `npm run build`
3. `npx cap sync android`
4. Open `android/` in Android Studio.
5. Build → Build APK(s), or Generate Signed Bundle for the Play Store.

Repeat `npm run build && npx cap sync android` after each web change.

**Config notes**
- The wrapped app talks to the API via HTTP(S). If you bundle only the frontend, point it at your deployed server with an **absolute API base URL**. Simplest reliable setup: wrap the *deployed PWA URL* or ship the server URL in config. (Capacitor serves the app from `capacitor://localhost`, so relative `/api` calls won't reach your server unless you set `server.url` or use an absolute base.)
- Push notifications: add `@capacitor/push-notifications` later if you want OTP/order alerts; not required for v1.
- Camera/mic permissions: add them in `AndroidManifest.xml` if you use photo upload or voice input inside the wrapper.

## Electron → Desktop app (step-by-step)

1. `npm i -D electron` (plus `electron-builder` for packaging).
2. Point Electron's `BrowserWindow` at the production build (`dist/index.html`) or at the deployed URL.
3. `electron-builder` → produces `.exe` / `.dmg` / `.AppImage`.

Use the deployed-URL variant if you want zero rebuilds per web change; use the bundled variant for offline use.

## Tauri (alternative to Electron)

Lighter than Electron (Rust backend, system webview):

```bash
# from the repo root
npm create tauri-app@latest   # or add to existing project per Tauri docs
```

Point Tauri's frontend at `dist`, set the dev/prod URLs, `npm run tauri build` → native installer. Smaller binaries, but the Rust toolchain is required.

## Play Store checklist

- [ ] Google Play developer account — **$25 one-time fee**.
- [ ] **App signing** — let Play manage the signing key (recommended) or manage your own keystore; don't lose it.
- [ ] **Privacy policy** — required if you collect phone numbers/emails (you do, for OTP login). Host it on your site and link it in the Play Console listing.
- [ ] Data safety form — declare OTP identifiers, uploads, and any analytics.
- [ ] Target API level — build with a recent Android Studio; Play rejects old targets.
- [ ] Test on a real device before the closed-testing track.

## Recommendation

Ship the **PWA first** (zero cost, works today), then Capacitor for the Play Store listing, then desktop via PWA install or Electron only if users ask for it.
