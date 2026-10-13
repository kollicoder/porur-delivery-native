# Porur Delivery — native apps (Expo / React Native)

Monorepo (npm workspaces):

| Path | App | ID |
|---|---|---|
| `apps/customer` | **Porur Delivery** — customer app | `com.porurdelivery.customer` |
| `apps/vendor` | **Porur Delivery Partner** — store/vendor app | `com.porurdelivery.vendor` |
| `packages/shared` | catalogue, pricing, voice parser, order logic, API layer | `@porur/shared` |

## Run in Expo Go
```bash
npm install            # at repo root (Node 20+)
cd apps/customer && npx expo start     # scan QR with Expo Go (Android/iOS)
cd apps/vendor   && npx expo start
```
Voice ordering uses `expo-speech-recognition` (native) — it is **not available in Expo Go**; the app falls back to typed ordering there. Use a development/release build (`npx expo run:android`, or EAS Build) to get the mic. Web (`npx expo start --web`) uses the browser's speech API.

## Build
- Web: `npx expo export -p web`
- Android APK locally: `npx expo prebuild -p android && cd android && ./gradlew assembleRelease` (JDK 17 + Android SDK). Release APK is signed with the debug key — fine for testing, not for Play Store.
- iOS / store builds: `npx eas-cli build` (needs a free Expo account; iOS needs an Apple Developer account).

## Data / backend
Everything is mock data stored on-device with AsyncStorage via `LocalApi` (`packages/shared/src/api.ts`).
The customer and vendor apps **do not sync with each other** — real-time sync needs a backend. Implement the `PorurApi` interface with HTTP calls and swap it in `getApi()`.

## Features
Customer: home & categories, product lists (Tamil names, bundled Noto Sans Tamil), search, cart (₹199 minimum, ₹25 fee, free above ₹499), checkout (mock UPI/COD), prescription photo (expo-image-picker), order tracking (map placeholder), voice ordering (ta-IN / en-IN + typed fallback), Book a Rider (₹99 first 3 km, ₹249/hour).
Vendor: login placeholder + store picker, incoming orders (accept/reject → ready for pickup), item catalogue with price edit & stock toggle, pharmacist Rx review (pharmacy), daily sales & weekly payout summary.
