import React, { useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { parseOrder, rs } from '@porur/shared';
import { K, F, Segmented, Card, Banner } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { Btn, tileColor } from '../../src/ui';
import { useApp } from '../../src/store';
import { listen, speechAvailable } from '../../src/speech';

export default function Voice() {
  const { addMany, lang: appLang } = useApp();
  const [lang, setLang] = useState<'ta-IN' | 'en-IN'>(appLang === 'ta' ? 'ta-IN' : 'en-IN'); const [text, setText] = useState('');
  const [live, setLive] = useState(false); const [err, setErr] = useState(''); const [res, setRes] = useState<ReturnType<typeof parseOrder> | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const mic = async () => {
    if (live) { stopRef.current(); setLive(false); return; }
    setErr(''); setLive(true);
    stopRef.current = await listen(lang, (t) => setText(t), (e) => { setLive(false); if (e) setErr(e); });
  };
  const add = () => { const m: Record<string, number> = {}; res!.items.forEach(i => m[i.product.id] = (m[i.product.id] || 0) + i.qty); addMany(m); router.push('/cart'); };
  return <ScrollView style={s.page} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
    <Text style={{ fontFamily: F.ta, color: K.muted, marginTop: -4, marginBottom: 10 }}>உங்கள் பட்டியலைச் சொல்லுங்கள்</Text>
    <Segmented value={lang} onChange={setLang} options={[['ta-IN', 'தமிழ்'], ['en-IN', 'English']] as const} />
    <Pressable testID="mic" accessibilityLabel={live ? 'Stop listening' : 'Tap and speak'} onPress={mic} style={{ marginTop: 14, backgroundColor: live ? K.red : K.orangeBright, borderRadius: 28, paddingVertical: 28, alignItems: 'center' }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: K.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 42 }}>🎤</Text></View>
      <Text style={{ fontFamily: F.display, fontSize: 22, color: live ? '#fff' : K.ink, marginTop: 12 }}>{live ? 'Listening… tap to stop' : 'Tap and speak'}</Text>
      <Text style={{ fontFamily: F.body, color: live ? '#fff' : K.ink, marginTop: 2 }}>{speechAvailable() ? '"Two kilo tomato, one litre milk"' : 'Voice needs the installed app — type below'}</Text>
    </Pressable>
    {!!err && <Banner tone="warn" icon="🎙️" title="Couldn't hear that" body={err} />}
    <Text style={s.label}>Or type it</Text>
    <TextInput testID="voice-text" style={[s.input, { minHeight: 76, fontFamily: lang === 'ta-IN' ? F.ta : F.body }]} multiline value={text} onChangeText={setText} placeholderTextColor={K.muted}
      placeholder={lang === 'ta-IN' ? 'உதா: 2 கிலோ தக்காளி, ஒரு லிட்டர் பால்' : 'e.g. 2 kg tomato, 1 litre milk, 1 dozen eggs'} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
      {['2 kg tomato, 1 litre milk, 1 dozen eggs', '5 kg rice and 1 kg dal', 'ரெண்டு தக்காளி, ஒரு பால்'].map(x =>
        <Pressable key={x} style={s.chip} onPress={() => { setText(x); setRes(parseOrder(x)); }}><Text style={{ fontFamily: /[\u0B80-\u0BFF]/.test(x) ? F.ta : F.bold, color: K.ink, fontSize: 13 }}>{x}</Text></Pressable>)}
    </View>
    <Btn title="Understand my order" disabled={!text.trim()} reason="Speak or type your list first" onPress={() => setRes(parseOrder(text))} />
    {res && <Card testID="parsed">
      <Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink, marginBottom: 6 }}>Here's what we understood</Text>
      {res.items.map((i, k) => <View key={k} style={[s.row, { paddingVertical: 6, gap: 10 }]}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tileColor(i.product.cat), alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>{i.product.emoji}</Text></View>
        <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{i.product.name}</Text><Text style={{ fontFamily: F.ta, color: K.muted, fontSize: 12 }}>{i.product.ta}</Text></View>
        <Text style={{ fontFamily: F.bold, color: K.ink }}>{i.qty} {i.product.unit} · {rs(i.product.price * i.qty)}</Text></View>)}
      {!!res.unknown.length && <Banner tone="warn" title="Couldn't match" body={res.unknown.join(', ') + ' — try the search or book a rider.'} />}
      {!!res.items.length && <Btn testID="add-parsed" color="primary" title={`Add ${res.items.length} item(s) to cart`} onPress={add} />}
    </Card>}
  </ScrollView>;
}
