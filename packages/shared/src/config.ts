/**
 * Backend config. Defaults to the LOCAL FIREBASE EMULATOR (demo project, no real cloud).
 * To use a real project set (Expo) EXPO_PUBLIC_FIREBASE_* env vars, e.g. in apps/<app>/.env:
 *   EXPO_PUBLIC_BACKEND=firebase            # or "local" for on-device only
 *   EXPO_PUBLIC_FIREBASE_PROJECT_ID=porur-delivery-xxxx
 *   EXPO_PUBLIC_FIREBASE_API_KEY=...  EXPO_PUBLIC_FIREBASE_APP_ID=...  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
 *   EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=      # empty => real cloud; "192.168.1.5" => emulator on your LAN
 */
const env = (k: string, d = '') => {
  // Expo inlines process.env.EXPO_PUBLIC_* at build time, but only for literal member access — so list them explicitly.
  const m: Record<string, string | undefined> = {
    BACKEND: process.env.EXPO_PUBLIC_BACKEND, PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID, AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EMULATOR_HOST: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST,
  };
  const v = m[k]; return v === undefined ? d : v;
};
const projectId = env('PROJECT_ID', 'demo-porur');
export const backendConfig = {
  backend: env('BACKEND', 'firebase') as 'firebase' | 'local',
  firebase: { projectId, apiKey: env('API_KEY', 'demo-api-key'), appId: env('APP_ID', '1:000:web:demo'), authDomain: env('AUTH_DOMAIN', `${projectId}.firebaseapp.com`) },
  // demo-* projects always use the emulator
  emulatorHost: env('EMULATOR_HOST', projectId.startsWith('demo-') ? 'localhost' : ''),
};
