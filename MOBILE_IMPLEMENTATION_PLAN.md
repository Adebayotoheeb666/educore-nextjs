# Mobile Implementation Plan

## Overview

This document describes a comprehensive plan to build an installable mobile version of the Educore Next.js application for Android (APK/AAB) and iOS (IPA). The goal is to ship a native-packaged app that reuses the web codebase where possible while providing a native-like experience, device integrations, offline support, and a CI/CD process for signed releases.

## Goals & Success Criteria

- Target platforms: Android (API level 24+) and iOS (iOS 15+ recommended).
- Deliverables: signed Android AAB (or APK), signed iOS IPA (TestFlight + App Store submission assets).
- UX: mobile-optimized navigation, responsive pages, acceptable performance (TTI within 5s on mid-range devices).
- Native features: push notifications, camera/file access, secure local storage, deep linking.
- Tests: automated unit tests and E2E tests covering core flows on emulators and at least one real device per platform.
- Acceptance: successful internal beta (TestFlight / Play internal) and staged production rollout.

## Audit Checklist (repo review tasks)

- Inventory pages that must be available in mobile builds (dashboard, attendance, fees, profile, notifications).
- Identify server-side-only pages or Node-specific APIs that must be adapted (getServerSideProps, API routes used only by web).
- List third-party web libs that rely on browser-only APIs or window globals.
- Identify global CSS, fonts, assets that affect bundle size.
- Evaluate authentication flows (cookies, http-only cookies, OAuth redirects) for native compatibility.

## Mobile Approach Options and Recommendation

1. Progressive Web App (PWA) / Trusted Web Activity (TWA)
   - Pros: Minimal rewrite, reuse of Next.js code, fast iteration.
   - Cons: Limited native APIs, App Store acceptance edge cases, iOS PWAs have restrictions.

2. Web-to-Native wrapper (Capacitor)
   - Pros: Reuse web app in a native WebView, native plugin access (camera, push), simpler migration.
   - Cons: WebView performance and some native UX trade-offs.

3. Native rewrite (React Native / Expo)
   - Pros: Full native UI and better performance for complex interactions.
   - Cons: Large rewrite cost, duplicated business logic, longer time-to-market.

Recommendation: Start with a Capacitor wrapper (WebView-hosted Next.js app built as static or serverless-backed files) to achieve fast, maintainable cross-platform releases. Re-evaluate a native rewrite if performance or deep native UX becomes a hard requirement.

## Chosen Stack (initial)

- Next.js (existing) as web core
- Capacitor for native packaging and plugins
- Firebase Cloud Messaging (FCM) + Apple Push Notification service (APNs) for push
- Secure storage plugins (Capacitor Secure Storage / Keychain)
- Fastlane for iOS/Android signing and upload automation
- GitHub Actions or GitLab CI for build pipelines
- Sentry or Firebase Crashlytics for crash reporting

## Detailed Implementation Steps

1. Preparation
   - Lock Node and package versions in `engines`.
   - Add audit checklist to repo issues for pages and APIs.
   - Add `manifest.json` and ensure PWA assets are correct.

2. Make the web app mobile-ready
   - Refactor layout to mobile-first components and responsive utilities.
   - Extract common UI primitives into `components/mobile/` where mobile-specific logic is needed.
   - Replace any server-only code or gate with client-appropriate fallbacks.
   - Optimize images and fonts; add lazy-loading for heavy modules.

3. Add Capacitor wrapper
   - Scaffold a Capacitor project at `mobile/capacitor/`.
   - Configure `capacitor.config.ts` with appId and serverURL for dev mode.
   - Configure the WebView to load the built static files for production.
   - Add plugins for Push, Camera, FilePicker, Clipboard, Device, and SecureStorage.

4. Authentication & Sessions
   - Choose token storage: migrate to JWT stored in secure storage or adapt http-only cookie flows via WebView if safe.
   - Implement OAuth redirects using system browser (AppAuth) or in-app WebView with custom URI schemes.

5. Offline & Caching
   - Implement a robust service worker with runtime caching strategies (stale-while-revalidate for API calls, cache-first for static assets).
   - Add a local DB (IndexedDB via localForage) for essential offline data and sync queue.

6. Push Notifications
   - Implement FCM integration for Android.
   - Implement APNs + token exchange for iOS.
   - Add server-side push functionality or integrate existing push service.

7. Native Permissions & Privacy
   - Add runtime permission flows for camera, storage, location with clear rationale dialogs.
   - Update privacy policy with mobile-specific sections.

8. Testing
   - Unit tests: maintain existing Jest tests; add mobile-specific unit tests if new code is introduced.
   - E2E: use Playwright or Detox to run flows in WebView/emulator; add smoke tests to CI for mobile builds.
   - Manual QA checklist covering device sizes, offline behavior, push, authentication, and deep links.

9. Build & Signing
   - Android: configure `build.gradle` signing configs, generate keystore, prefer AAB for Play Store.
   - iOS: configure Xcode project via Capacitor, create provisioning profiles and distribution certificate, set export options.
   - Use Fastlane for signing and uploads.

10. CI/CD
   - Create GitHub Actions workflows for: `build:web`, `build:mobile:android`, `build:mobile:ios` (macOS runner required for iOS).
   - Securely store secrets (keystore, certificates, API keys) in GitHub Secrets or a vault.

11. Store Submission
   - Prepare metadata, screenshots, privacy URL, contact info, and release notes.
   - Perform internal testing (TestFlight, Play internal) and then staged rollout.

12. Monitoring & Post-launch
   - Add crash reporting and analytics.
   - Set up release monitoring dashboards and alerts.

## Timeline & Estimates (example)

- Week 0: repo audit, goals definition, PWA baseline (1 week)
- Week 1–2: mobile UX adjustments and responsive refactor (2 weeks)
- Week 3: Capacitor wrapper scaffolding and plugin integration (1 week)
- Week 4: Auth + push notifications + secure storage (1 week)
- Week 5: Offline support, sync queue, and testing (1 week)
- Week 6: CI/CD, signing, and internal beta release (1 week)
- Week 7: QA, store submission, and staged rollout (1 week)

Total: ~7–8 weeks for an MVP cross-platform mobile wrapper.

## Risks & Mitigations

- WebView performance: mitigate by code-splitting and aggressive lazy-loading; consider native rewrite for critical screens.
- App Store PWA restrictions: use Capacitor to avoid pure-PWA App Store rejections.
- Authentication complexity: prefer tokens + secure storage, and document cookie limitations in WebView.
- Build/CI complexity for iOS: allocate macOS runners and Fastlane maintenance.

## Checklist for Developer Tasks (actionable)

- [ ] Run a dependency audit and upgrade risky packages.
- [ ] Add PWA manifest and service worker improvements.
- [ ] Create `mobile/capacitor` scaffold and link to web build output.
- [ ] Implement `SecureStorage` token storage and refresh flow.
- [ ] Integrate FCM and APNs and test push end-to-end.
- [ ] Configure CI runners and Fastlane lanes for release.
- [ ] Generate multi-resolution icons and launch screens.
- [ ] Complete TestFlight and Play internal testing.

## Useful Commands & Examples

Install Capacitor and scaffold:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init educore com.educore.app
```

Build web for production and copy to Capacitor:

```bash
npm run build
npx cap copy android
npx cap copy ios
```

Run Android (emulator):

```bash
npx cap open android
```

Run iOS (requires macOS):

```bash
npx cap open ios
```

## Appendix: Resources

- Capacitor docs: https://capacitorjs.com/docs
- Fastlane docs: https://docs.fastlane.tools
- Google Play Console: https://play.google.com/console
- Apple Developer: https://developer.apple.com

---

Document created to guide the mobile packaging and release process. Update this file with audit findings and task owners as work proceeds.
