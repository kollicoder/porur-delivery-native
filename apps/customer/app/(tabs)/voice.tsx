import React, { useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { parseOrder, rs } from '@porur/shared';
import { s, C, TA } from '../../src/theme';
import { Btn } from '../../src/ui';
import { useApp } from '../../src/store';
import { listen, speechAvailable } from '../../src/speech';

export default function Voice() {
  const { addMany } = useApp();
  const [lang, setLang] = useState<'ta-IN' | 'en-IN'>('en-IN'); const [text, setText] = useState('');
  const [live, setLive] = useState(false); const [err, setErr] = useState(''); const [res, setRes] = useState<ReturnType<typeof parseOrder> | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const mic = async () => {
    if (live) { stopRef.current(); setLive(false); return; }
    setErr(''); setLive(true);
    stopRef.current = await listen(lang, (t) => setText(t), (e) => { setLive(false); if (e) setErr(e); });
  };
  const add = () => { const m: Record<string, number> = {}; res!.items.forEach(i => m[i.product.id] = (m[i.product.id] || 0) + i.qty); addMany(m); router.push('/cart'); };
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4 }}>
      {([['ta-IN', 'தமிழ்'], ['en-IN', 'English']] as const).map(([l, n]) => <Pressable key={l} onPress={() => setLang(l)} style={{ flex: 1, padding: 9, borderRadius: 9, alignItems: 'center', backgroundColor: lang === l ? '#fff' : 'transparent' }}>
        <Text style={{ fontWeight: '700', fontFamily: l === 'ta-IN' ? TA : undefined }}>{n}</Text></Pressable>)}
    </View>
    <View style={{ alignItems: 'center', marginVertical: 18 }}>
      <Pressable testID="mic" onPress={mic} style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: live ? '#dc2626' : C.orange, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 46 }}>🎤</Text></Pressable>
      <Text style={[s.muted, { marginTop: 8 }]}>{live ? 'Listening… tap to stop' : speechAvailable() ? 'Tap and speak your list' : 'Voice needs the full app build — type below'}</Text>
    </View>
    {!!err && <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, padding: 10 }}><Text>{err}</Text></View>}
    <Text style={s.label}>Or type your list</Text>
    <TextInput testID="voice-text" style={[s.input, { minHeight: 70, fontFamily: lang === 'ta-IN' ? TA : undefined }]} multiline value={text} onChangeText={setText}
      placeholder={lang === 'ta-IN' ? 'உதா: 2 கிலோ தக்காளி, ஒரு லிட்டர் பால்' : 'e.g. 2 kg tomato, 1 litre milk, 1 dozen eggs'} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
      {['2 kg tomato, 1 litre milk, 1 dozen eggs', '5 kg rice and 1 kg dal', 'ரெண்டு தக்காளி, ஒரு பால்'].map(x =>
        <Pressable key={x} style={s.chip} onPress={() => { setText(x); setRes(parseOrder(x)); }}><Text style={{ fontFamily: /[\u0B80-\u0BFF]/.test(x) ? TA : undefined }}>{x}</Text></Pressable>)}
    </View>
    <Btn title="Understand my order" disabled={!text.trim()} onPress={() => setRes(parseOrder(text))} />
    {res && <View style={s.card}>
      <Text style={{ fontWeight: '800', marginBottom: 6 }}>Here's what we understood:</Text>
      {res.items.map((i, k) => <View key={k} style={[s.row, { paddingVertical: 4 }]}><Text>{i.product.emoji} {i.product.name} <Text style={{ fontFamily: TA, color: C.muted }}>{i.product.ta}</Text></Text><Text>{i.qty} {i.product.unit} · {rs(i.product.price * i.qty)}</Text></View>)}
      {!!res.unknown.length && <Text style={s.muted}>Couldn't match: {res.unknown.join(', ')}</Text>}
      {!!res.items.length && <Btn testID="add-parsed" title={`Add ${res.items.length} item(s) to cart`} onPress={add} />}
    </View>}
    <Text style={[s.muted, { marginTop: 12, fontSize: 12 }]}>ℹ️ Prototype: simple keyword matching on our catalogue. Real AI understanding comes later.</Text>
  </ScrollView>;
}
