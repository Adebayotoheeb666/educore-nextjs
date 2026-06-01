# Capacitor minimal scaffold for Educore

This folder contains a minimal Capacitor configuration to run the web app inside a native WebView.

Principles
- The Next.js app should be built and exported to a static `out/` directory: this scaffold points `webDir` at `out/`.
- Use the Capacitor CLI to add platforms and generate native projects; those steps are listed below.

Prerequisites
- Node.js, npm
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)
- Optional: install Capacitor globally: `npm i -g @capacitor/cli` (or use `npx`)

Quick start (from repository root)

1. Build and export static site

```bash
npm run build
# export static files (ensure your Next config supports `next export`)
npm run export
```

2. Initialize Capacitor (one-time)

```bash
# from repo root
npx cap init Educore com.educore.app --web-dir=out
# or rely on the provided capacitor.config.json and skip init
```

3. Add platforms and run

```bash
# add Android
npx cap add android
npx cap copy
npx cap open android

# add iOS (macOS only)
npx cap add ios
npx cap copy
npx cap open ios
```

Notes
- `webDir` in `capacitor.config.json` is set to `../../out` because this file lives under `mobile/capacitor` and the export output is at the repository root `out/`.
- Next.js features that rely on server-side rendering or API routes will not work in a purely static export. For dynamic features, prefer calling your server-side `app/api/**` endpoints over HTTPS from the mobile app.
- For tokens and sensitive storage, use Capacitor `SecureStorage` or the `@capacitor/preferences` plugin instead of `localStorage`.

Next steps I can take for you
- Run guarded edits to `app/providers.tsx` and `app/(app)/layout.tsx` to avoid runtime errors in the WebView, or
- Create a checked TODO file listing each file in `MOBILE_AUDIT_CHECKLIST.md` as a commit-ready checklist.
