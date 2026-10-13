import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { cartTotals, buildOrders, rs } from '@porur/shared';
import { s, C } from '../src/theme';
import { Btn } from '../src/ui';
import { useApp, api } from '../src/store';
import { MapView } from '@porur/shared/src/ui/MapView';
export default function Checkout() {
  const { cart, clear, products, settings, uid, who, pushToken } = useApp(); const { lines, total, needsRx } = cartTotals(cart, products, settings);
  const [addr, setAddr] = useState('Flat 2A, Sri Sai Apartments, Mount-Poonamallee Rd, Porur'); const [pay, setPay] = useState<'UPI' | 'COD'>('UPI');
  const [rx, setRx] = useState<string>(); const [busy, setBusy] = useState(false);
  const [loc, setLoc] = useState({ lat: 13.0502, lng: 80.1655 }); const [locMsg, setLocMsg] = useState('');
  const useMyLoc = () => { const g = (globalThis as any).navigator?.geolocation; if (!g) { setLocMsg('Location unavailable — pin set to your address'); return; }
    setLocMsg('Finding you…'); g.getCurrentPosition((p: any) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocMsg(`📍 Pinned · ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`); }, () => setLocMsg('Location permission denied — using your address'), { timeout: 8000 }); };
  const hasMed = lines.some(l => products.find(p => p.id === l.productId)?.cat === 'med');
  const pick = async (camera: boolean) => {
    const r = camera ? await ImagePicker.launchCameraAsync({ quality: 0.6 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled) return;
    // No Firebase Storage on the free plan: shrink to ~600px JPEG and keep it inline (base64) in the order doc
    const m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 600 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    setRx('data:image/jpeg;base64,' + m.base64);
  };
  const place = async () => {
    setBusy(true); await new Promise(r => setTimeout(r, pay === 'UPI' ? 900 : 200)); // mock UPI
    const orders = buildOrders(cart, { ...who, customerUid: uid, address: addr, pay, prescriptionUri: rx, dropLat: loc.lat, dropLng: loc.lng, customerPushToken: pushToken }, products, settings);
    await api.createOrders(orders); clear(); router.replace(`/order/${orders[0].id}`);
  };
  if (!lines.length) return <View style={s.page}><Text style={[s.muted, { padding: 20 }]}>Cart is empty.</Text></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.label}>Deliver to</Text><TextInput style={s.input} multiline value={addr} onChangeText={setAddr} />
    <View style={{ marginTop: 8 }}><MapView testID="checkout-map" height={150} pins={[{ lat: loc.lat, lng: loc.lng, emoji: '📍', label: 'Deliver here' }]} center={loc} /></View>
    <Pressable testID="use-loc" onPress={useMyLoc} style={[s.chip, { alignSelf: 'flex-start', marginTop: 8 }]}><Text>📍 Use my current location</Text></Pressable>
    {!!locMsg && <Text style={s.muted}>{locMsg}</Text>}
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
