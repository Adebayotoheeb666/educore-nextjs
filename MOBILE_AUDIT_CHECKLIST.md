# Mobile Audit Checklist

This checklist lists files in the repo that use browser-only APIs or have mobile-specific concerns, plus recommended actions for each. Use this as the actionable starting point for the Capacitor wrapper / PWA packaging work.

Summary
- PWA assets & service worker: `public/sw.js` and dependency `@ducanh2912/next-pwa` are present.
- Many pages use direct `window`/`document`/`localStorage` and must be guarded or adapted for WebView/native plugin equivalents.
- The app uses App Router and contains many server-side route handlers under `app/api/**` — these remain server-side and must be reachable from the mobile app.

Files using browser-only APIs and recommended fixes

- `app/providers.tsx`
  - Uses: `document`, `localStorage`, `navigator.serviceWorker`.
  - Action: Guard access with `typeof window !== 'undefined'` and `typeof navigator !== 'undefined'` where not already guarded. For token storage consider migrating auth tokens to `SecureStorage` (Capacitor) instead of `localStorage` for sensitive data.

- `app/(app)/layout.tsx` (and variants)
  - Uses: `localStorage`, `document.documentElement.setAttribute`.
  - Action: Keep theme storage but guard for SSR. Consider exposing a Theme API that reads/writes via Capacitor Storage when running inside the native container.

- `app/page.tsx`, `app/about-us/page.tsx`, `app/privacy/page.tsx`, `app/for-schools/page.tsx`, `app/terms/page.tsx`, `app/blog/page.tsx`, `app/blog/[id]/page.tsx`, `app/careers/page.tsx`, `app/our-team/page.tsx`, `app/resources/page.tsx`, `app/security/page.tsx`, `app/contact-us/page.tsx`
  - Uses: `window.scrollY`, `window.addEventListener('scroll')`, `window.removeEventListener` and `document.getElementById`.
  - Action: Convert scroll handlers to useEffect with guards for `window`. Where possible use React refs instead of `document.getElementById`. Prevent running scroll logic during SSR.

- `app/offline/page.tsx`
  - Uses: `window.location.reload()`.
  - Action: Guard access with `typeof window !== 'undefined'`. For native wrapper, use Capacitor App APIs to control lifecycle if needed.

- `app/(app)/services/ServicesClient.tsx` and `app/(app)/school/services/page.tsx`
  - Uses: `window.location.href = paymentResult.authorizationUrl` (payment redirect).
  - Action: Replace `window.open`/`window.location` flows with Capacitor `Browser` plugin or use system browser for OAuth/payment flows. Alternatively implement native payment flow or use server-side flow that returns a deep link.

- `app/(app)/parent/fees/page.tsx`, `app/(app)/fees/collection/page.tsx`, `app/(app)/fees/collection/page.tsx` and `app/(app)/fees/collection/page.tsx`
  - Uses: `window.PaystackPop`, `window.open`, `window.PaystackPop.setup()`.
  - Action: Move payment provider interactions to server when possible. For in-app payments use system browser or native SDKs; if continuing with Paystack JS, ensure WebView supports the required features and add guards for `window`.

- `app/(app)/fees/schedules/page.tsx`
  - Uses: `window.scrollTo()`.
  - Action: Guard `window` use in client-side only blocks.

Other notable files
- `public/sw.js`
  - Action: Keep service worker, but verify behavior inside native WebView (some WebView hosts ignore service workers). For Android TWA or Capacitor, service worker will work for WebView-based static assets; verify on iOS (WKWebView service worker support is limited).

- `PAYMENT_INTEGRATION.md` (docs)
  - Mentions `window.location.href` flows; review and update mobile instructions.

Server-side routes
- `app/api/**` (many files)
  - These are server-side route handlers (route.ts) — they cannot run inside the mobile WebView as Node APIs. Action items:
    - Ensure the mobile app calls these endpoints over HTTPS using the correct `API_BASE_URL` config.
    - Validate authentication method: if app uses http-only cookies, WebView cookie handling can be tricky; prefer token-based auth (JWT + secure storage) or ensure cookie sync between WebView and server.
    - Check CORS and CSRF considerations for WebView-originated requests.

Dependencies & environment notes
- `package.json` shows `@ducanh2912/next-pwa` — PWA support exists and can be leveraged for initial mobile packaging.
- Environment config: add runtime `MOBILE_API_BASE_URL` and a flag `IS_MOBILE_WEBVIEW` to tune behaviors at runtime.

Actionable next steps (short)
1. Replace/guard direct `window`/`document`/`localStorage` usage in files listed above (use guards and useEffect). Mark each file done in the audit checklist.
2. Decide token strategy: migrate sensitive tokens to `SecureStorage` for native builds.
3. Replace payment redirects with Capacitor Browser/system browser flows or server-based flows.
4. Verify `public/sw.js` behavior on iOS WebView and Android WebView; consider fallbacks when service worker not present.
5. Add `MOBILE_API_BASE_URL` config and document how to run web build for Capacitor.

If you want, I can now:
- Create a file-level TODO checklist (one checkbox per file) and commit it, or
- Start applying the guarded code changes automatically for the highest-priority files (e.g., `app/providers.tsx` and layout files).
