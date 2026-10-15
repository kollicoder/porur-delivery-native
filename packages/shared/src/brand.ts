/**
 * BRAND — single place for the app name. FINAL NAME NOT DECIDED YET: 'ding-dong' is the design placeholder.
 * Override at build time with EXPO_PUBLIC_BRAND_NAME (web prototype: VITE_BRAND_NAME). Store listings also need app.json "name".
 */
export const BRAND = {
  name: process.env.EXPO_PUBLIC_BRAND_NAME || 'ding-dong',
  partner: (process.env.EXPO_PUBLIC_BRAND_NAME || 'ding-dong') + ' Partner',
  area: 'Porur, Chennai 600116',
};
/** Demo/test helpers (OTP hints, simulate buttons) are shown only in dev, emulator, or web with ?test=1. */
export const isTestMode = (emulator?: boolean) => {
  if (emulator) return true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  try { return typeof location !== 'undefined' && /[?&]test=1/.test(location.search + location.hash); } catch { return false; }
};
