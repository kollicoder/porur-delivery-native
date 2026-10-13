/** reCAPTCHA for Firebase Phone Auth inside React Native (same approach as the old expo-firebase-recaptcha):
 *  a WebView on the project's authDomain renders Firebase's RecaptchaVerifier and posts the token back. */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, Platform } from 'react-native';
import type { ApplicationVerifier } from 'firebase/auth';
import { backendConfig } from '../config';

const html = (cfg: object) => `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script></head>
<body style="display:flex;align-items:center;justify-content:center;height:90vh;margin:0;font-family:sans-serif">
<div id="rc"></div><script>
firebase.initializeApp(${JSON.stringify(cfg)});
const send = m => window.ReactNativeWebView.postMessage(JSON.stringify(m));
const v = new firebase.auth.RecaptchaVerifier('rc', { size: 'normal', callback: t => send({ token: t }), 'expired-callback': () => send({ error: 'expired' }) });
v.render().catch(e => send({ error: String(e.message || e) }));
</script></body></html>`;

export type RecaptchaHandle = { verifier: ApplicationVerifier };
export const NativeRecaptcha = forwardRef<RecaptchaHandle>((_, ref) => {
  const [open, setOpen] = useState(false); const pending = useRef<{ res: (t: string) => void; rej: (e: Error) => void } | undefined>(undefined);
  const WebView = Platform.OS === 'web' ? null : require('react-native-webview').WebView;
  useImperativeHandle(ref, () => ({ verifier: { type: 'recaptcha', _reset() {}, verify: () => new Promise<string>((res, rej) => { pending.current = { res, rej }; setOpen(true); }) } as unknown as ApplicationVerifier }));
  const done = (fn: (p: NonNullable<typeof pending.current>) => void) => { setOpen(false); const p = pending.current; pending.current = undefined; p && fn(p); };
  if (!WebView) return null;
  return <Modal visible={open} animationType="slide" onRequestClose={() => done(p => p.rej(new Error('Verification cancelled')))}>
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ textAlign: 'center', fontWeight: '700', fontSize: 16 }}>Quick check before we send your code</Text>
      <WebView style={{ flex: 1 }} originWhitelist={['*']} javaScriptEnabled
        source={{ html: html(backendConfig.firebase), baseUrl: `https://${backendConfig.firebase.authDomain}` }}
        onMessage={(e: any) => { const m = JSON.parse(e.nativeEvent.data); done(p => m.token ? p.res(m.token) : p.rej(new Error(m.error))); }} />
      <Pressable onPress={() => done(p => p.rej(new Error('Verification cancelled')))} style={{ padding: 16, alignItems: 'center' }}><Text style={{ color: '#2563eb' }}>Cancel</Text></Pressable>
    </View></Modal>;
});
