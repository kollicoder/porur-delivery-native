import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { RecaptchaVerifier } from 'firebase/auth';
import { FirestoreApi, testVerifier } from '../firebase';
import { NativeRecaptcha, RecaptchaHandle } from './Recaptcha';

/** Phone OTP login. Emulator / test numbers: no reCAPTCHA. Web export: invisible reCAPTCHA. Native: WebView reCAPTCHA. */
export function PhoneLogin({ api, title, subtitle, color = '#16a34a', dark = false, testHint }: { api: FirestoreApi; title: string; subtitle: string; color?: string; dark?: boolean; testHint?: string }) {
  const [phone, setPhone] = useState('+91 '); const [code, setCode] = useState(''); const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const rc = useRef<RecaptchaHandle>(null); const webVerifier = useRef<RecaptchaVerifier | undefined>(undefined);
  const norm = (p: string) => p.replace(/[^\d+]/g, '');
  const verifier = () => {
    if (api.emulator || (api.auth.settings as any).appVerificationDisabledForTesting) return testVerifier;
    if (Platform.OS === 'web') return (webVerifier.current ||= new RecaptchaVerifier(api.auth, 'recaptcha-web', { size: 'invisible' }));
    return rc.current!.verifier;
  };
  const send = async () => { setErr(''); setBusy(true); try { await api.sendCode(norm(phone), verifier()); setStep('code'); } catch (e: any) { setErr(e.code === 'auth/invalid-phone-number' ? 'Enter a valid number like +91 98400 12345' : e.message); } setBusy(false); };
  const verify = async () => { setErr(''); setBusy(true); try { await api.confirmCode(code.trim()); } catch (e: any) { setErr(e.code === 'auth/invalid-verification-code' ? 'Wrong code, try again' : e.message); setBusy(false); } };
  const fg = dark ? '#fff' : '#111827';
  const inp = { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 12, padding: 12, fontSize: 18, backgroundColor: '#fff', marginTop: 6 } as const;
  return <ScrollView style={{ flex: 1, backgroundColor: dark ? '#0f172a' : '#f8fafc' }} contentContainerStyle={{ padding: 22, paddingTop: 70 }} keyboardShouldPersistTaps="handled">
    <Text style={{ color: fg, fontSize: 30, fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: dark ? '#94a3b8' : '#6b7280', marginTop: 6 }}>{subtitle}</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 24 }}>
      {step === 'phone' ? <>
        <Text style={{ fontWeight: '600' }}>Mobile number</Text>
        <TextInput testID="phone" style={inp} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoFocus />
        <Pressable testID="send-code" onPress={busy ? undefined : send} style={{ backgroundColor: busy ? '#9ca3af' : color, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }}><Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Sending…' : 'Send OTP'}</Text></Pressable>
      </> : <>
        <Text>Code sent to <Text style={{ fontWeight: '800' }}>{phone}</Text>  <Text style={{ color: '#2563eb' }} onPress={() => setStep('phone')}>change</Text></Text>
        <TextInput testID="otp" style={[inp, { letterSpacing: 6 }]} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoFocus />
        <Pressable testID="verify" onPress={busy ? undefined : verify} style={{ backgroundColor: busy ? '#9ca3af' : color, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 }}><Text style={{ color: '#fff', fontWeight: '800' }}>{busy ? 'Verifying…' : 'Verify & continue'}</Text></Pressable>
      </>}
      {!!err && <Text style={{ color: '#b91c1c', marginTop: 8 }}>{err}</Text>}
      {Platform.OS === 'web' && React.createElement('div', { id: 'recaptcha-web' })}
    </View>
    {api.emulator ? <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 12 }}>Emulator mode: any number works; the code is shown in the emulator.</Text>
      : testHint ? <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 12 }}>{testHint}</Text> : null}
    <NativeRecaptcha ref={rc} />
  </ScrollView>;
}
