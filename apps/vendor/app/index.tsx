import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { STORES, CATEGORIES } from '@porur/shared';
import { s, C } from '../src/theme';
import { useVendor } from '../src/store';
export default function Login() {
  const { store, setStoreId, ready } = useVendor(); const [phone, setPhone] = useState('98410 22110'); const [sel, setSel] = useState('s1');
  useEffect(() => { if (ready && store) router.replace('/orders'); }, [ready, store]);
  return <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={{ padding: 22, paddingTop: 70 }}>
    <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>Porur Delivery{'\n'}Partner</Text>
    <Text style={{ color: '#94a3b8', marginTop: 6 }}>For our tie-up stores — receive orders, manage stock, get paid weekly.</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 24 }}>
      <Text style={s.label}>Registered mobile number</Text><TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={[s.muted, { marginTop: 4, fontSize: 12 }]}>Login placeholder — OTP verification comes with the backend.</Text>
      <Text style={s.label}>Select your store (demo)</Text>
      {STORES.map(st => <Pressable key={st.id} testID={'store-' + st.id} onPress={() => setSel(st.id)} style={[s.card, { borderWidth: 2, borderColor: sel === st.id ? C.green : 'transparent', flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
        <Text style={{ fontSize: 26 }}>{CATEGORIES.find(c => c.id === st.cat)!.emoji}</Text>
        <View><Text style={{ fontWeight: '800' }}>{st.name}</Text><Text style={s.muted}>{st.type} · {st.commission}% commission</Text></View></Pressable>)}
      <Pressable testID="login" style={s.btn} onPress={() => { setStoreId(sel); router.replace('/orders'); }}><Text style={s.btnTxt}>Continue</Text></Pressable>
    </View></ScrollView>;
}
