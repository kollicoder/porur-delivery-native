/** Safe wrapper: expo-speech-recognition is a native module — missing in Expo Go, so we fall back to typing. */
type SR = { start: (o: any) => void; stop: () => void; requestPermissionsAsync: () => Promise<{ granted: boolean }>; addListener: (e: string, cb: (ev: any) => void) => { remove: () => void }; isRecognitionAvailable?: () => boolean };
let mod: SR | null = null;
try { mod = require('expo-speech-recognition').ExpoSpeechRecognitionModule ?? null; } catch { mod = null; }
export const speechAvailable = () => { try { return !!mod && (mod.isRecognitionAvailable ? mod.isRecognitionAvailable() : true); } catch { return false; } };
export async function listen(lang: 'ta-IN' | 'en-IN', onText: (t: string, final: boolean) => void, onEnd: (err?: string) => void) {
  if (!mod || !speechAvailable()) { onEnd('Voice is not available here (e.g. Expo Go). Please type your list.'); return () => {}; }
  const perm = await mod.requestPermissionsAsync(); if (!perm.granted) { onEnd('Microphone permission denied.'); return () => {}; }
  const subs = [
    mod.addListener('result', (e: any) => onText(e.results?.[0]?.transcript ?? '', !!e.isFinal)),
    mod.addListener('error', (e: any) => onEnd(e.message || e.error)),
    mod.addListener('end', () => onEnd()),
  ];
  mod.start({ lang, interimResults: true, continuous: false });
  return () => { try { mod!.stop(); } catch {} subs.forEach(x => x.remove()); };
}
