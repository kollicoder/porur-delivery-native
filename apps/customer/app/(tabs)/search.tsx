import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { K, F, SkeletonList, Empty } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { ProductRow, CartBar } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Search() {
  const { products, productsReady, t } = useApp(); const [q, setQ] = useState('');
  const res = q ? products.filter(p => (p.name + ' ' + p.ta + ' ' + p.kw.join(' ')).toLowerCase().includes(q.toLowerCase())) : [];
  return <View style={s.page}><ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
    <TextInput testID="search-input" style={[s.input, { borderRadius: 999, paddingHorizontal: 18 }]} placeholder={t('Search in English or தமிழ்', 'ஆங்கிலம் அல்லது தமிழில் தேடுங்கள்')} placeholderTextColor={K.muted} value={q} onChangeText={setQ} autoFocus />
    {!q && <><Text style={s.label}>{t('Popular', 'பிரபலமானவை')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['milk', 'tomato', 'rice', 'paracetamol', 'banana', 'தக்காளி'].map(x =>
      <Pressable key={x} style={s.chip} onPress={() => setQ(x)}><Text style={{ fontFamily: /[\u0B80-\u0BFF]/.test(x) ? F.ta : F.bold, color: K.ink }}>{x}</Text></Pressable>)}</View></>}
    {!!q && !productsReady && <SkeletonList testID="search-loading" n={3} />}
    {res.map(p => <ProductRow key={p.id} p={p} />)}
    {!!q && productsReady && !res.length && <Empty testID="search-empty" emoji="🔎" title="Not on our shelves yet" body={`We couldn't find "${q}". Book a rider and we'll buy it for you.`} action="Book a rider" onAction={() => router.push('/rider')} />}
  </ScrollView><CartBar /></View>;
}
