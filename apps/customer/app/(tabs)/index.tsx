import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, STORES } from '@porur/shared';
import { s, C, TA } from '../../src/theme';
import { CartBar } from '../../src/ui';

export default function Home() {
  return <SafeAreaView style={s.page} edges={['top']}><ScrollView contentContainerStyle={s.pad}>
    <View style={{ backgroundColor: C.green, borderRadius: 18, padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 12 }}>📍 Delivering to <Text style={{ fontWeight: '800' }}>Porur, Chennai 600116</Text></Text>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 }}>Porur Delivery</Text>
      <Text style={{ color: '#ecfdf5', marginVertical: 6 }}>Groceries, fruits & veg and medicines in ~30 min. Open 24 x 7.</Text>
      <Pressable onPress={() => router.push('/search')} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12 }}><Text style={s.muted}>🔍 Search tomato, milk, paracetamol…</Text></Pressable>
    </View>
    <Pressable testID="voice-cta" onPress={() => router.push('/voice')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 14, backgroundColor: '#fff7ed', borderWidth: 2, borderStyle: 'dashed', borderColor: '#fb923c', borderRadius: 16, padding: 12 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 26 }}>🎤</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontWeight: '800' }}>Just say it!</Text><Text style={s.muted}>Speak in <Text style={{ fontFamily: TA }}>தமிழ்</Text> or English — "2 kg tomato, 1 litre milk"</Text></View>
    </Pressable>
    <Text style={s.h3}>What do you need?</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {CATEGORIES.map(c => <Pressable key={c.id} testID={'cat-' + c.id} onPress={() => router.push(c.id === 'rider' ? '/rider' : `/category/${c.id}`)}
        style={{ width: '48%', backgroundColor: c.color, borderRadius: 16, padding: 14, minHeight: 100 }}>
        <Text style={{ fontSize: 30 }}>{c.emoji}</Text><Text style={{ fontWeight: '800', marginTop: 4 }}>{c.label}</Text><Text style={[s.muted, { fontFamily: TA }]}>{c.ta}</Text></Pressable>)}
    </View>
    <Text style={s.h3}>Partner stores near you</Text>
    {STORES.map(st => <Pressable key={st.id} onPress={() => router.push(`/category/${st.cat}`)} style={[s.card, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
      <Text style={{ fontSize: 26 }}>{CATEGORIES.find(c => c.id === st.cat)!.emoji}</Text>
      <View><Text style={{ fontWeight: '700' }}>{st.name}</Text><Text style={s.muted}>⭐ {st.rating} · {st.eta} · {st.open}</Text></View></Pressable>)}
    <View style={{ backgroundColor: '#1e3a8a', borderRadius: 14, padding: 12, marginTop: 12 }}><Text style={{ color: '#fff' }}>🌙 Night delivery for medicines, 11 PM – 6 AM. Free delivery above ₹499.</Text></View>
  </ScrollView><CartBar /></SafeAreaView>;
}
