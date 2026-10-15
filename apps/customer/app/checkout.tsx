import React, { useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { cartTotals, buildOrders, rs, PayMode, STORES } from '@porur/shared';
import { s, C } from '../src/theme';
import { K, F, Card, Banner, Pill, Empty } from '@porur/shared/src/ui/kit';
import { Btn } from '../src/ui';
import { useApp, api } from '../src/store';
import { MapView } from '@porur/shared/src/ui/MapView';
export default function Checkout() {
  const { cart, clear, products, settings, uid, who, pushToken } = useApp(); const { lines, subtotal, fee, total, needsRx } = cartTotals(cart, products, settings);
  const nStores = new Set(lines.map(l => products.find(p => p.id === l.productId)?.store)).size;
  const [addr, setAddr] = useState('Flat 2A, Sri Sai Apartments, Mount-Poonamallee Rd, Porur'); const [pay, setPay] = useState<PayMode>('COD'); const [err, setErr] = useState('');
  const [rx, setRx] = useState<string>(); const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null); const [rxY, setRxY] = useState(0); const [flash, setFlash] = useState(false);
  const goToRx = () => { scroll.current?.scrollTo({ y: Math.max(0, rxY - 12), animated: true }); setFlash(true); setTimeout(() => setFlash(false), 1600); };
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
    } catch (e: any) { const m = String(e?.message || e); setErr(/network|offline|unavailable/i.test(m) ? "You're offline or the network dropped. Your cart is saved — try again." : 'Could not place the order: ' + m); setBusy(false); }
  };
  if (!lines.length) return <View style={[s.page, { justifyContent: 'center' }]}><Empty emoji="🧺" title="Your cart is empty" action="Browse stores" onAction={() => router.replace('/')} /></View>;
  const locked = needsRx && !rx;
  return <ScrollView ref={scroll} style={s.page} contentContainerStyle={s.pad}>
    <Text style={{ fontFamily: F.ta, color: K.muted, marginTop: -4 }}>ஆர்டரை உறுதிசெய்யுங்கள்</Text>
    <Text style={s.label}>Deliver to</Text>
    <MapView testID="checkout-map" height={150} pins={[{ lat: loc.lat, lng: loc.lng, emoji: '📍', label: 'Deliver here' }]} center={loc} />
    <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}><Text style={{ fontSize: 18 }}>🏠</Text>
      <TextInput testID="addr" accessibilityLabel="Delivery address" style={{ flex: 1, fontFamily: F.body, fontSize: 15, color: K.ink, padding: 0 }} multiline value={addr} onChangeText={setAddr} /></Card>
    <Pressable testID="use-loc" onPress={useMyLoc} style={[s.chip, { alignSelf: 'flex-start', marginTop: 4 }]}><Text style={{ fontFamily: F.bold, color: K.ink }}>📍 Use my current location</Text></Pressable>
    {!!locMsg && <Text style={s.muted}>{locMsg}</Text>}
    {(hasMed || needsRx) && <View onLayout={e => setRxY(e.nativeEvent.layout.y)} testID="rx-section">
      <Text style={s.label}>Prescription</Text>
      <Card style={{ borderWidth: flash ? 3 : 1, borderColor: flash || locked ? K.orange : K.line }}>
        <View style={s.row}><Text style={{ fontFamily: F.bold, color: K.ink }}>📄 Photo of your prescription</Text>
          <Pill label={rx ? 'Added' : needsRx ? 'Required' : 'Optional'} bg={rx ? K.greenSoft : needsRx ? K.orangeSoft : K.soft} fg={rx ? '#14532D' : needsRx ? '#7A2E0B' : K.ink} /></View>
        <Text style={[s.muted, { marginTop: 4 }]}>Only you and the pharmacist can see this photo — never the rider.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pressable testID="rx-camera" style={[s.chip, { flex: 1, alignItems: 'center' }]} onPress={() => pick(true)}><Text style={{ fontFamily: F.bold, color: K.ink }}>📷 Take photo</Text></Pressable>
          <Pressable testID="rx-gallery" style={[s.chip, { flex: 1, alignItems: 'center' }]} onPress={() => pick(false)}><Text style={{ fontFamily: F.bold, color: K.ink }}>🖼️ From gallery</Text></Pressable></View>
        {rx && <Image source={{ uri: rx }} style={{ width: 90, height: 90, borderRadius: 12, marginTop: 6 }} />}
      </Card></View>}
    <Text style={s.label}>Pay on delivery</Text>
    {([['COD', '💵 Cash on delivery', 'Pay the rider in cash'], ['UPI_DOD', '📱 UPI on delivery', 'Scan & pay with GPay / PhonePe / Paytm at your door']] as const).map(([k, n, sub]) =>
      <Pressable key={k} testID={'pay-' + k} accessibilityRole="radio" accessibilityState={{ checked: pay === k }} onPress={() => setPay(k)} style={[s.card, { borderWidth: 2, borderColor: pay === k ? K.ink : K.line, minHeight: 56 }]}>
        <Text style={{ fontFamily: F.bold, color: K.ink }}>{pay === k ? '◉' : '○'}  {n}</Text><Text style={[s.muted, { marginLeft: 22 }]}>{sub}</Text></Pressable>)}
    <View style={[s.card, { backgroundColor: K.soft }]} testID="pay-online"><Text style={{ fontFamily: F.bold, color: K.muted }}>○  💳 Pay online now (UPI / cards)  <Text style={{ color: '#7A2E0B', fontSize: 12 }}>COMING SOON</Text></Text></View>
    <Text style={s.label}>Bill</Text>
    <View style={s.card} testID="bill">
      {lines.map(l => { const p = products.find(x => x.id === l.productId); return <View key={l.productId} style={[s.row, { paddingVertical: 2 }]}><Text style={[s.muted, { flex: 1 }]}>{p?.name} × {l.qty}</Text><Text style={s.muted}>{rs((p?.price ?? 0) * l.qty)}</Text></View>; })}
      <View style={[s.row, { marginTop: 6 }]}><Text style={{ fontFamily: F.body, color: K.ink }}>Item total</Text><Text style={{ fontFamily: F.bold, color: K.ink }}>{rs(subtotal)}</Text></View>
      <View style={s.row}><Text style={{ fontFamily: F.body, color: K.ink }}>Delivery fee{nStores > 1 ? ' (once for this checkout)' : ''}</Text><Text style={{ fontFamily: F.bold, color: K.ink }}>{fee ? rs(fee) : 'FREE'}</Text></View>
      <View style={[s.row, { borderTopWidth: 1, borderColor: K.line, marginTop: 6, paddingTop: 6 }]}><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>To pay at delivery</Text><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{rs(total)}</Text></View>
      {nStores > 1 && <Text style={[s.muted, { fontSize: 12 }]}>Your items come from {nStores} stores, so you'll get {nStores} orders. The delivery fee is charged once.</Text>}
    </View>
    {!!err && <Banner testID="place-error" tone="error" icon="⚠️" title="Order not placed" body={err} action="Retry" onAction={place} />}
    <Btn testID="place" title={busy ? 'Placing…' : `Place order · ${rs(total)}`} disabled={busy || locked} reason={locked ? 'Add your prescription photo to place this order — tap here to go to it.' : undefined} onLockedPress={locked ? goToRx : undefined} onPress={place} />
  </ScrollView>;
}
