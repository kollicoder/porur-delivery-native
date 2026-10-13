import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { cartTotals, buildOrders, rs, PayMode, STORES } from '@porur/shared';
import { s, C } from '../src/theme';
import { Btn } from '../src/ui';
import { useApp, api } from '../src/store';
import { MapView } from '@porur/shared/src/ui/MapView';
export default function Checkout() {
  const { cart, clear, products, settings, uid, who, pushToken } = useApp(); const { lines, subtotal, fee, total, needsRx } = cartTotals(cart, products, settings);
  const nStores = new Set(lines.map(l => products.find(p => p.id === l.productId)?.store)).size;
  const [addr, setAddr] = useState('Flat 2A, Sri Sai Apartments, Mount-Poonamallee Rd, Porur'); const [pay, setPay] = useState<PayMode>('COD'); const [err, setErr] = useState('');
  const [rx, setRx] = useState<string>(); const [busy, setBusy] = useState(false);
  const [loc, setLoc] = useState({ lat: 13.0502, lng: 80.1655 }); const [locMsg, setLocMsg] = useState('');
  const useMyLoc = () => { const g = (globalThis as any).navigator?.geolocation; if (!g) { setLocMsg('Location unavailable — pin set to your address'); return; }
    setLocMsg('Finding you…'); g.getCurrentPosition((p: any) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocMsg(`📍 Pinned · ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`); }, () => setLocMsg('Location permission denied — using your address'), { timeout: 8000 }); };
  const hasMed = lines.some(l => products.find(p => p.id === l.productId)?.cat === 'med');
  const pick = async (camera: boolean) => {
    const r = camera ? await ImagePicker.launchCameraAsync({ quality: 0.6 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (r.canceled) return;
    // No Storage bucket on the Spark plan: shrink to ~800px JPEG and save it in its own private prescriptions/{orderId} doc (rules cap ~300 KB)
    let m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    if ((m.base64?.length ?? 0) > 280000) m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 600 } }], { compress: 0.35, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    if ((m.base64?.length ?? 0) > 280000) { setErr('Photo too large — please retake it closer to the prescription.'); return; }
    setErr(''); setRx('data:image/jpeg;base64,' + m.base64);
  };
  const place = async () => {
    setBusy(true); setErr('');
    try {
      const orders = buildOrders(cart, { ...who, customerUid: uid, address: addr, pay, prescriptionUri: rx, dropLat: loc.lat, dropLng: loc.lng, customerPushToken: pushToken }, products, settings);
      await api.createOrders(orders, { prescription: rx }); clear(); router.replace(`/order/${orders[0].id}`);
    } catch (e: any) { setErr('Could not place the order: ' + (e?.message || e)); setBusy(false); }
  };
  if (!lines.length) return <View style={s.page}><Text style={[s.muted, { padding: 20 }]}>Cart is empty.</Text></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.label}>Deliver to</Text><TextInput style={s.input} multiline value={addr} onChangeText={setAddr} />
    <View style={{ marginTop: 8 }}><MapView testID="checkout-map" height={150} pins={[{ lat: loc.lat, lng: loc.lng, emoji: '📍', label: 'Deliver here' }]} center={loc} /></View>
    <Pressable testID="use-loc" onPress={useMyLoc} style={[s.chip, { alignSelf: 'flex-start', marginTop: 8 }]}><Text>📍 Use my current location</Text></Pressable>
    {!!locMsg && <Text style={s.muted}>{locMsg}</Text>}
    {(hasMed || needsRx) && <View style={s.card}>
      <Text style={{ fontWeight: '800' }}>📄 Prescription {needsRx ? '(required)' : '(optional)'}</Text>
      <Text style={s.muted}>Only the pharmacist and you can see this photo — never the rider.</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable style={s.chip} onPress={() => pick(true)}><Text>📷 Take photo</Text></Pressable>
        <Pressable style={s.chip} onPress={() => pick(false)}><Text>🖼️ From gallery</Text></Pressable></View>
      {rx && <Image source={{ uri: rx }} style={{ width: 90, height: 90, borderRadius: 8, marginTop: 6 }} />}
    </View>}
    <Text style={s.label}>Pay on delivery</Text>
    {([['COD', '💵 Cash on delivery', 'Pay the rider in cash'], ['UPI_DOD', '📱 UPI on delivery', 'Scan & pay with GPay / PhonePe / Paytm at your door']] as const).map(([k, n, sub]) =>
      <Pressable key={k} testID={'pay-' + k} onPress={() => setPay(k)} style={[s.card, { borderWidth: 1.5, borderColor: pay === k ? C.green : 'transparent' }]}><Text>{pay === k ? '◉' : '○'}  {n}</Text><Text style={[s.muted, { fontSize: 12, marginLeft: 22 }]}>{sub}</Text></Pressable>)}
    <View style={[s.card, { opacity: 0.55 }]} testID="pay-online"><Text>○  💳 Pay online now (UPI / cards)  <Text style={{ color: '#b45309', fontWeight: '800', fontSize: 11 }}>COMING SOON</Text></Text></View>
    <View style={s.card} testID="bill">
      <View style={s.row}><Text>Item total</Text><Text>{rs(subtotal)}</Text></View>
      <View style={s.row}><Text>Delivery fee{nStores > 1 ? ' (once for this checkout)' : ''}</Text><Text>{fee ? rs(fee) : 'FREE'}</Text></View>
      <View style={[s.row, { borderTopWidth: 1, borderColor: C.line, marginTop: 6, paddingTop: 6 }]}><Text style={{ fontWeight: '800' }}>To pay at delivery</Text><Text style={{ fontWeight: '800' }}>{rs(total)}</Text></View>
      {nStores > 1 && <Text style={[s.muted, { fontSize: 12 }]}>Your items come from {nStores} stores, so you'll get {nStores} orders. The delivery fee is charged once.</Text>}
    </View>
    {!!err && <Text style={{ color: '#dc2626', marginTop: 6 }}>{err}</Text>}
    <Btn testID="place" title={busy ? 'Placing…' : `Place order · ${rs(total)}`} disabled={busy || (needsRx && !rx)} onPress={place} />
    {needsRx && !rx && <Text style={[s.muted, { marginTop: 6 }]}>Attach the prescription to continue.</Text>}
  </ScrollView>;
}
