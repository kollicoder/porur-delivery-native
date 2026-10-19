/** v0.6 UI helpers on top of the ding-dong kit (same palette, 48dp targets, AA contrast). */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, StyleProp, ViewStyle } from 'react-native';
import { K, F, TAP } from './kit';
/** Re-renders every `ms` (countdowns, expiry). */
export function useNow(ms = 30000) { const [n, setN] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setN(Date.now()), ms); return () => clearInterval(i); }, [ms]); return n; }
export const Title = ({ en, ta, size = 20, testID }: { en: string; ta?: string; size?: number; testID?: string }) =>
  <View testID={testID} style={{ marginTop: 18, marginBottom: 8 }}><Text style={{ fontFamily: F.display, fontSize: size, color: K.ink }}>{en}</Text>{!!ta && <Text style={{ fontFamily: F.ta, fontSize: 12, color: K.muted, marginTop: 1 }}>{ta}</Text>}</View>;
export function Meter({ count, threshold, testID, dark }: { count: number; threshold: number; testID?: string; dark?: boolean }) {
  const pct = Math.min(100, Math.round((count / threshold) * 100));
  return <View testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: threshold, now: count }}>
    <View style={{ height: 18, borderRadius: 999, backgroundColor: dark ? '#3A372F' : K.soft, overflow: 'hidden', borderWidth: 1, borderColor: dark ? '#57554D' : K.line }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: K.yellow, borderRadius: 999 }} /></View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
      <Text style={{ fontFamily: F.bold, color: dark ? '#fff' : K.ink, fontSize: 13 }}>{count} / {threshold} baskets</Text>
      <Text style={{ fontFamily: F.bold, color: dark ? '#E9E4D8' : K.muted, fontSize: 13 }}>{pct}%</Text></View></View>;
}
/** Selectable 48dp chip */
export const Chip = ({ label, on, onPress, testID, style }: { label: string; on?: boolean; onPress?: () => void; testID?: string; style?: StyleProp<ViewStyle> }) =>
  <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress}
    style={[{ minHeight: TAP, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: on ? K.ink : K.line, backgroundColor: on ? K.ink : '#fff', justifyContent: 'center', marginRight: 8, marginBottom: 8 }, style]}>
    <Text style={{ fontFamily: /[\u0B80-\u0BFF]/.test(label) ? F.ta : F.bold, color: on ? '#fff' : K.ink }}>{label}</Text></Pressable>;
export const Field = ({ label, value, onChangeText, testID, placeholder, keyboardType, multiline, maxLength }: { label: string; value: string; onChangeText: (s: string) => void; testID?: string; placeholder?: string; keyboardType?: any; multiline?: boolean; maxLength?: number }) =>
  <View style={{ marginTop: 10 }}><Text style={{ fontFamily: F.bold, fontSize: 14, marginBottom: 6, color: K.ink2 }}>{label}</Text>
    <TextInput testID={testID} accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={K.muted} keyboardType={keyboardType} multiline={multiline} maxLength={maxLength}
      style={{ borderWidth: 1.5, borderColor: K.line, borderRadius: 16, padding: 13, fontSize: 16, backgroundColor: '#fff', fontFamily: F.body, color: K.ink, minHeight: multiline ? 72 : TAP }} /></View>;
export const Kv = ({ k, v, bold, testID }: { k: string; v: string; bold?: boolean; testID?: string }) =>
  <View testID={testID} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, gap: 10 }}>
    <Text style={{ fontFamily: bold ? F.display : F.body, color: K.ink, fontSize: bold ? 17 : 14, flex: 1 }}>{k}</Text><Text style={{ fontFamily: bold ? F.display : F.bold, color: K.ink, fontSize: bold ? 17 : 14 }}>{v}</Text></View>;
/** Big code display (OTP / pickup code) */
export const CodeBox = ({ label, code, testID, sub }: { label: string; code?: string | null; testID?: string; sub?: string }) =>
  <View testID={testID} style={{ backgroundColor: K.ink, borderRadius: 20, padding: 14, marginVertical: 6 }}>
    <Text style={{ fontFamily: F.bold, color: '#E9E4D8', fontSize: 13 }}>{label}</Text>
    <Text style={{ fontFamily: F.display, color: K.yellow, fontSize: 34, letterSpacing: 6 }}>{code || '····'}</Text>
    {!!sub && <Text style={{ fontFamily: F.body, color: '#E9E4D8', fontSize: 12 }}>{sub}</Text>}</View>;
/** Tappable 1–5 star rating, each star a 48dp target */
export const Stars = ({ value, onChange, testID }: { value: number; onChange: (n: number) => void; testID?: string }) =>
  <View testID={testID} style={{ flexDirection: 'row' }}>{[1, 2, 3, 4, 5].map(n => <Pressable key={n} testID={testID ? `${testID}-${n}` : undefined} accessibilityLabel={`${n} star`} onPress={() => onChange(n)} style={{ width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 28, color: n <= value ? '#B45309' : '#B7B3A8' }}>{n <= value ? '★' : '☆'}</Text></Pressable>)}</View>;
