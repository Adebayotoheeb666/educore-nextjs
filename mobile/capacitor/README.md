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
npm run export
```

Alternatively, use the repo convenience script:

```bash
npm run mobile:export
```

Optional local dev configuration

```bash
CAPACITOR_DEV_SERVER_URL=http://10.0.2.2:3000 npx cap open android
```

If `CAPACITOR_DEV_SERVER_URL` is set, the native WebView will point at that URL instead of the exported `out/` files.

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
npm run mobile:cap:sync
npx cap open android

# add iOS (macOS only)
npx cap add ios
npm run mobile:cap:sync
npx cap open ios
```

Notes
- `webDir` in `capacitor.config.js` is set to `../../out` because this file lives under `mobile/capacitor` and the export output is at the repository root `out/`.
- Next.js features that rely on server-side rendering or API routes will not work in a purely static export. For dynamic features, prefer calling your server-side `app/api/**` endpoints over HTTPS from the mobile app.
- Set `NEXT_PUBLIC_MOBILE_API_BASE_URL` when building the mobile app so API calls from the packaged WebView resolve to the correct server origin.
  - Example: `NEXT_PUBLIC_MOBILE_API_BASE_URL=https://app.educore.ng npm run mobile:export`
- For tokens and sensitive storage, use Capacitor `SecureStorage` or the `@capacitor/preferences` plugin instead of `localStorage`.

Next steps I can take for you
- Run guarded edits to `app/providers.tsx` and `app/(app)/layout.tsx` to avoid runtime errors in the WebView, or
- Create a checked TODO file listing each file in `MOBILE_AUDIT_CHECKLIST.md` as a commit-ready checklist.
