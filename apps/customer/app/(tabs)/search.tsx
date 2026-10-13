import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { s } from '../../src/theme';
import { ProductRow, CartBar } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Search() {
  const { products } = useApp(); const [q, setQ] = useState('');
  const res = q ? products.filter(p => (p.name + ' ' + p.ta + ' ' + p.kw.join(' ')).toLowerCase().includes(q.toLowerCase())) : [];
  return <View style={s.page}><ScrollView contentContainerStyle={s.pad}>
    <TextInput style={s.input} placeholder="Search in English or தமிழ்" value={q} onChangeText={setQ} autoFocus />
    {!q && <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>{['milk', 'tomato', 'rice', 'paracetamol', 'banana'].map(x => <Pressable key={x} style={s.chip} onPress={() => setQ(x)}><Text>{x}</Text></Pressable>)}</View>}
    {res.map(p => <ProductRow key={p.id} p={p} />)}
    {!!q && !res.length && <Text style={[s.muted, { marginTop: 12 }]}>No match. Try "Book a Rider" — we'll buy it for you!</Text>}
  </ScrollView><CartBar /></View>;
}
