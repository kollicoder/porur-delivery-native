import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { RecaptchaVerifier } from 'firebase/auth';
import { FirestoreApi, testVerifier } from '../firebase';
import { NativeRecaptcha, RecaptchaHandle } from './Recaptcha';
import { K, F, Button, Banner } from './kit';
import { isTestMode } from '../brand';

const RESEND_S = 30;
/** Phone OTP login (v0.5 design). Emulator / test numbers: no reCAPTCHA. Web export: invisible reCAPTCHA. Native: WebView reCAPTCHA. */
export function PhoneLogin({ api, title, subtitle, dark = false, testHint, brand, taLine }: { api: FirestoreApi; title: string; subtitle: string; color?: string; dark?: boolean; testHint?: string; brand?: string; taLine?: string }) {
  const [phone, setPhone] = useState('+91 '); const [code, setCode] = useState(''); const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<{ title: string; body?: string; kind?: 'wrong' | 'expired' | 'other' } | null>(null);
  const [left, setLeft] = useState(0); const rc = useRef<RecaptchaHandle>(null); const webVerifier = useRef<RecaptchaVerifier | undefined>(undefined);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left]);
  const norm = (p: string) => p.replace(/[^\d+]/g, '');
  const verifier = () => {
    if (api.emulator || (api.auth.settings as any).appVerificationDisabledForTesting) return testVerifier;
    if (Platform.OS === 'web') return (webVerifier.current ||= new RecaptchaVerifier(api.auth, 'recaptcha-web', { size: 'invisible' }));
    return rc.current!.verifier;
  };
  const netMsg = (e: any) => /network/i.test(e?.code || e?.message || '') ? { title: "You're offline", body: 'Check your internet and try again.' } : null;
  const send = async () => { setErr(null); setBusy(true); try { await api.sendCode(norm(phone), verifier()); setStep('code'); setCode(''); setLeft(RESEND_S); }
    catch (e: any) { setErr(netMsg(e) || (e.code === 'auth/invalid-phone-number' ? { title: 'Check the number', body: 'Enter a valid number like +91 98400 12345' } : e.code === 'auth/too-many-requests' ? { title: 'Too many tries', body: 'Please wait a few minutes before asking for another code.' } : { title: "Couldn't send the code", body: e.message })); }
    setBusy(false); };
  const verify = async () => { setErr(null); setBusy(true); try { await api.confirmCode(code.trim()); }
    catch (e: any) { setErr(netMsg(e) || (e.code === 'auth/invalid-verification-code' ? { title: 'Wrong code', body: 'That code doesn\'t match. Check the SMS and try again.', kind: 'wrong' }
      : e.code === 'auth/code-expired' || e.code === 'auth/session-expired' ? { title: 'Code expired', body: 'Codes last a few minutes. Tap “Resend code” for a new one.', kind: 'expired' } : { title: "Couldn't verify", body: e.message })); setBusy(false); } };
  const fg = dark ? '#fff' : K.ink; const sub = dark ? '#E9E4D8' : K.muted;
  const inp = { borderWidth: 2, borderColor: K.yellow, borderRadius: 16, padding: 14, fontSize: 20, backgroundColor: '#fff', marginTop: 8, fontFamily: F.bold, color: K.ink } as const;
  const showHint = isTestMode(api.emulator);
  return <ScrollView style={{ flex: 1, backgroundColor: dark ? K.ink : K.bg }} contentContainerStyle={{ padding: 22, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
    <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: K.yellow, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>🛵</Text></View>
    {!!brand && <Text testID="brand-name" style={{ color: fg, fontFamily: F.display, fontSize: 34, marginTop: 16, letterSpacing: -0.8 }}>{brand}</Text>}
    <Text style={{ color: fg, fontSize: brand ? 20 : 30, fontFamily: F.display, marginTop: 6, lineHeight: brand ? 25 : 34 }}>{title}</Text>
    {!!taLine && <Text style={{ color: sub, fontFamily: F.ta, marginTop: 6 }}>{taLine}</Text>}
    <Text style={{ color: sub, marginTop: 6, fontFamily: F.body, fontSize: 15 }}>{subtitle}</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 22, borderWidth: 1, borderColor: K.line }}>
      {step === 'phone' ? <>
        <Text style={{ fontFamily: F.display, fontSize: 19, color: K.ink }}>Enter your mobile number</Text>
        <Text style={{ fontFamily: F.body, color: K.muted, marginTop: 2 }}>We'll text you a 6-digit code. No password needed.</Text>
        <TextInput testID="phone" accessibilityLabel="Mobile number" style={inp} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoFocus />
        <Button testID="send-code" kind="dark" title={busy ? 'Sending…' : 'Send OTP'} disabled={busy || norm(phone).length < 8} onPress={send} style={{ marginTop: 14 }} />
      </> : <>
        <Text style={{ fontFamily: F.display, fontSize: 19, color: K.ink }}>Enter the 6-digit code</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}><Text style={{ fontFamily: F.body, color: K.muted }}>Sent to <Text style={{ fontFamily: F.bold, color: K.ink }}>{phone}</Text></Text>
          <Pressable testID="change-number" onPress={() => { setStep('phone'); setErr(null); }} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 }}><Text style={{ fontFamily: F.bold, color: K.ink, textDecorationLine: 'underline' }}>Change</Text></Pressable></View>
        <TextInput testID="otp" accessibilityLabel="6-digit code" style={[inp, { letterSpacing: 10, textAlign: 'center', borderColor: err?.kind === 'wrong' ? K.red : K.yellow }]} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoFocus />
        <Button testID="verify" kind="dark" title={busy ? 'Verifying…' : 'Verify & continue'} disabled={busy || code.trim().length < 6} onPress={verify} style={{ marginTop: 14 }} />
        <Pressable testID="resend" disabled={left > 0 || busy} onPress={send} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
          <Text style={{ fontFamily: F.bold, color: left > 0 ? K.muted : K.ink, textDecorationLine: left > 0 ? 'none' : 'underline' }}>{left > 0 ? `Resend code in 0:${String(left).padStart(2, '0')}` : 'Resend code'}</Text></Pressable>
      </>}
      {!!err && <Banner testID="login-error" tone="error" icon="⚠️" title={err.title} body={err.body} />}
      {Platform.OS === 'web' && React.createElement('div', { id: 'recaptcha-web' })}
    </View>
    {showHint && <Text testID="test-hint" style={{ color: sub, marginTop: 12, fontSize: 12, fontFamily: F.body }}>{api.emulator ? 'Emulator mode: any number works; the code is shown in the emulator.' : testHint}</Text>}
    <NativeRecaptcha ref={rc} />
  </ScrollView>;
}
