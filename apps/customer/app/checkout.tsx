import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { cartTotals, buildOrders, rs, productById } from '@porur/shared';
import { s, C } from '../src/theme';
import { Btn } from '../src/ui';
import { useApp, api, ME } from '../src/store';
export default function Checkout() {
  const { cart, clear, refresh } = useApp(); const { lines, total, needsRx } = cartTotals(cart);
  const [addr, setAddr] = useState('Flat 2A, Sri Sai Apartments, Mount-Poonamallee Rd, Porur'); const [pay, setPay] = useState<'UPI' | 'COD'>('UPI');
  const [rx, setRx] = useState<string>(); const [busy, setBusy] = useState(false);
  const hasMed = lines.some(l => productById(l.productId)?.cat === 'med');
  const pick = async (camera: boolean) => {
    const r = camera ? await ImagePicker.launchCameraAsync({ quality: 0.6 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled) setRx(r.assets[0].uri);
  };
  const place = async () => {
    setBusy(true); await new Promise(r => setTimeout(r, pay === 'UPI' ? 900 : 200)); // mock UPI
    const orders = buildOrders(cart, { ...ME, address: addr, pay, prescriptionUri: rx });
    await api.createOrders(orders); clear(); await refresh(); router.replace(`/order/${orders[0].id}`);
  };
  if (!lines.length) return <View style={s.page}><Text style={[s.muted, { padding: 20 }]}>Cart is empty.</Text></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.label}>Deliver to</Text><TextInput style={s.input} multiline value={addr} onChangeText={setAddr} />
    {(hasMed || needsRx) && <View style={s.card}>
      <Text style={{ fontWeight: '800' }}>📄 Prescription {needsRx ? '(required)' : '(optional)'}</Text>
      <Text style={s.muted}>A licensed pharmacist verifies before dispatch. (Prototype: stays on this phone.)</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable style={s.chip} onPress={() => pick(true)}><Text>📷 Take photo</Text></Pressable>
        <Pressable style={s.chip} onPress={() => pick(false)}><Text>🖼️ From gallery</Text></Pressable></View>
      {rx && <Image source={{ uri: rx }} style={{ width: 90, height: 90, borderRadius: 8, marginTop: 6 }} />}
    </View>}
    <Text style={s.label}>Pay with</Text>
    {([['UPI', '📱 UPI (GPay / PhonePe / Paytm)'], ['COD', '💵 Cash on delivery']] as const).map(([k, n]) =>
      <Pressable key={k} onPress={() => setPay(k)} style={[s.card, { borderWidth: 1.5, borderColor: pay === k ? C.green : 'transparent' }]}><Text>{pay === k ? '◉' : '○'}  {n}</Text></Pressable>)}
    <Btn testID="place" title={busy ? (pay === 'UPI' ? 'Waiting for UPI… (mock)' : 'Placing…') : `Place order · ${rs(total)}`} disabled={busy || (needsRx && !rx)} onPress={place} />
    {needsRx && !rx && <Text style={[s.muted, { marginTop: 6 }]}>Attach the prescription to continue.</Text>}
  </ScrollView>;
}
