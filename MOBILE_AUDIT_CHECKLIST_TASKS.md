# Mobile Audit - Commit-ready Checklist

This file is a commit-ready checklist mapping audited files to their current status. Checkboxes indicate whether the file has been patched/verified for mobile WebView compatibility.

- [x] `app/providers.tsx` — Done: guarded `document`/`localStorage` and service worker registration.
- [x] `app/(app)/layout.tsx` — Done: guarded `localStorage`, `document` updates, and EventSource usage.
- [x] `app/about-us/page.tsx` — Done: guarded scroll handlers.
- [x] `app/privacy/page.tsx` — Done: guarded scroll handlers and `document.getElementById` access.
- [x] `app/for-schools/page.tsx` — Done: guarded scroll handlers.
- [x] `app/careers/page.tsx` — Done: guarded scroll handlers.
- [x] `app/blog/page.tsx` — Done: guarded scroll handlers.
- [x] `app/blog/[id]/page.tsx` — Done: guarded scroll handlers.
- [x] `app/terms/page.tsx` — Done: guarded scroll handlers and `document` access.
- [x] `app/offline/page.tsx` — Done: guarded `window.location.reload()`.
- [x] `app/(app)/services/ServicesClient.tsx` — Done: guarded payment redirect.
- [x] `app/(app)/school/services/page.tsx` — Done: guarded payment redirect.
- [x] `app/(app)/parent/fees/page.tsx` — Done: guarded Paystack usage and fallback flows.
- [x] `app/(app)/fees/collection/page.tsx` — Done: guarded Paystack usage and fallback flows.
- [x] `app/(app)/student/fees/page.tsx` — Done: guarded Paystack usage and fallback flows.
- [x] `app/page.tsx` — Done: guarded scroll handlers.
- [x] `app/our-team/page.tsx` — Done: guarded scroll handlers.
- [x] `app/resources/page.tsx` — Done: guarded scroll handlers.
- [x] `app/security/page.tsx` — Done: guarded scroll handlers.
- [x] `app/contact-us/page.tsx` — Done: guarded scroll handlers.
- [x] `app/(app)/fees/schedules/page.tsx` — Done: guarded `window.scrollTo()`.
- [x] `app/help-center/page.tsx` — Done: guarded scroll handlers.
- [x] `redux/features/auth/authSlice.ts` — Done: guarded localStorage writes/removals.
- [x] `lib/utils/fetch.ts` — Done: guarded localStorage access before reading token.
- [x] `lib/hooks/useServicePayment.ts` — Done: guarded payment redirect for SSR/WebView.
- [ ] `public/sw.js` — TODO: Verify service worker behavior on Android/iOS WebViews (manual testing).
- [ ] `PAYMENT_INTEGRATION.md` — TODO: Update docs to include mobile/Capacitor guidance (use system browser or native SDKs).
- [ ] `app/api/**` — TODO: Confirm mobile API access strategy (HTTPS base URL, auth tokens vs httpOnly cookies, CORS).

Notes:
- Completed items were patched to avoid direct crashes in SSR and restricted WebView environments.
- Remaining TODOs are lower-impact pages and documentation; prioritize pages used in mobile flows (auth, payments, dashboard) next.
