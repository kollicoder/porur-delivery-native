import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CUSTOMER_STEPS, rs, STORES, backendConfig, HUB, PAY_LABEL } from '@porur/shared';
import { MapView } from '@porur/shared/src/ui/MapView';
import { K, F, Card, Skeleton, Empty, Button, TAP } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { Btn } from '../../src/ui';
import { api, useApp } from '../../src/store';
export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { orders, riders, ordersReady } = useApp(); const o = orders.find(x => x.id === id);
  const [otp, setOtp] = useState<string | null>(null); useEffect(() => api.watchSecret ? api.watchSecret(id!, setOtp) : undefined, [id]);
  if (!o && !ordersReady) return <View testID="track-loading" style={[s.page, s.pad, { gap: 12 }]}><Skeleton h={220} r={22} /><Skeleton h={90} r={22} /><Skeleton h={160} r={22} /></View>;
  if (!o) return <View style={[s.page, { justifyContent: 'center' }]}><Empty emoji="🔍" title="Order not found" body="It may belong to another account." action="My orders" onAction={() => router.replace('/orders')} /></View>;
  const rider = riders.find(r => r.id === o.rider); const store = STORES.find(x => x.id === o.storeId);
  const idx = Math.max(0, CUSTOMER_STEPS.findIndex(x => x.key === o.status));
  const next = CUSTOMER_STEPS[idx + 1]; const rejected = o.status === 'rejected'; const rxRejected = o.rxStatus === 'rejected';
  const eta = new Date(+new Date(o.createdAt) + 30 * 60000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    {rejected ? <Card testID={rxRejected ? 'order-cancelled' : 'store-rejected'} style={{ backgroundColor: K.redSoft, borderColor: '#F3B6AE' }}>
      <Text style={{ fontFamily: F.display, fontSize: 22, color: '#7A1A12' }}>{rxRejected ? 'Order cancelled' : 'Store couldn\'t take this order'}</Text>
      <Text style={{ fontFamily: F.body, color: '#7A1A12', marginTop: 4 }}>{rxRejected ? 'The pharmacist couldn\'t approve the prescription. Nothing to pay. Please upload a clear, valid prescription and order again.' : `${store?.name ?? 'The store'} is out of stock or closing. Nothing to pay — your other items (if any) are still on the way.`}</Text>
      <Button title="Shop again" kind="dark" onPress={() => router.replace(o.storeId ? `/category/${store?.cat}` : '/')} style={{ marginTop: 12 }} />
    </Card> : <>
      <MapView testID="track-map" height={220} pins={[
        ...(store ? [{ lat: store.lat, lng: store.lng, emoji: '🏪', label: store.name.split(' ')[0] }] : []),
        { lat: o.dropLat ?? HUB.lat + 0.01, lng: o.dropLng ?? HUB.lng + 0.01, emoji: '🏠', label: 'You' },
        ...(rider?.lat && idx >= 1 && o.status !== 'delivered' ? [{ lat: rider.lat, lng: rider.lng!, emoji: '🛵', label: rider.name }] : []),
      ]} />
      <View testID="track-card" style={{ backgroundColor: K.ink, borderRadius: 22, padding: 16, marginTop: -28, marginHorizontal: 6 }}>
        <Text style={{ fontFamily: F.body, color: '#E9E4D8', fontSize: 12 }}>{o.status === 'delivered' ? 'Order complete' : 'Your rider is on the way'}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 24, color: '#fff' }}>{o.status === 'delivered' ? 'Delivered 🎉' : `Arriving by ${eta}`}</Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>{CUSTOMER_STEPS.map((st, i) => <View key={st.key} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= idx ? K.yellow : '#57554D' }} />)}</View>
      </View>
      <Card>{CUSTOMER_STEPS.map((st, i) => <View key={st.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: i <= idx ? K.green : K.soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12 }}>{i <= idx ? '✓' : ''}</Text></View>
        <Text style={{ fontFamily: i === idx ? F.bold : F.body, color: i <= idx ? K.ink : K.muted, fontSize: 15 }}>{st.label}</Text></View>)}
        {o.rxStatus && <Text style={{ marginTop: 6, fontFamily: F.body, color: K.ink }}>💊 Prescription: <Text style={{ fontFamily: F.bold }}>{o.rxStatus}</Text></Text>}
      </Card>
      {o.status !== 'delivered' && <View testID="otp-card" style={{ backgroundColor: K.yellow, borderRadius: 22, padding: 16, marginVertical: 6 }}>
        <Text style={{ fontFamily: F.bold, color: K.ink }}>Delivery OTP: <Text style={{ fontFamily: F.display, fontSize: 26, letterSpacing: 6 }}> {otp ?? o.otp ?? '····'} </Text></Text>
        <Text style={{ fontFamily: F.body, color: K.ink, fontSize: 13 }}>Only you can see this code. Tell it to the rider when you receive the order.</Text></View>}
      {rider && <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: K.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{rider.name[0]}</Text></View>
        <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{rider.name} is your rider</Text><Text style={s.muted}>📞 {rider.phone}</Text></View>
        <Pressable testID="call-rider" accessibilityLabel={'Call ' + rider.name} onPress={() => Linking.openURL('tel:' + rider.phone)} style={{ minWidth: TAP, minHeight: TAP, borderRadius: 24, backgroundColor: K.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontFamily: F.bold }}>Call</Text></Pressable></Card>}
    </>}
    <View style={s.card} testID="order-bill">
      <Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink, marginBottom: 4 }}>{o.type === 'errand' ? '🛵 Errand' : store?.name}</Text>
      {o.parts && o.parts > 1 && <Text style={[s.muted, { fontSize: 12 }]}>Part {o.part} of {o.parts} from one checkout (one order per store)</Text>}
      {o.type === 'errand' ? <Text style={{ fontFamily: F.body, color: K.ink }}>{o.note}</Text> : o.lines.map(l => <View key={l.productId} style={s.row}><Text style={{ flex: 1, fontFamily: F.body, color: K.ink }}>{l.name} × {l.qty}</Text><Text style={{ fontFamily: F.body, color: K.ink }}>{rs(l.price * l.qty)}</Text></View>)}
      {o.type !== 'errand' && <><View style={[s.row, { marginTop: 6, borderTopWidth: 1, borderColor: K.line, paddingTop: 6 }]}><Text style={{ fontFamily: F.body, color: K.ink }}>Item total</Text><Text style={{ fontFamily: F.body, color: K.ink }}>{rs(o.subtotal)}</Text></View>
        <View style={s.row}><Text style={{ fontFamily: F.body, color: K.ink }}>Delivery fee</Text><Text style={{ fontFamily: F.body, color: K.ink }}>{o.fee ? rs(o.fee) : (o.parts && o.part! > 1 ? 'on part 1' : 'FREE')}</Text></View>
        {!!o.feeNote && <Text style={[s.muted, { fontSize: 12 }]}>{o.feeNote}</Text>}</>}
      <View style={[s.row, { marginTop: 6 }]} testID="order-total"><Text style={{ fontFamily: F.bold, color: K.ink }}>Total · {PAY_LABEL[o.pay] ?? o.pay}</Text><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{rs(o.total)}</Text></View>
      <Text style={[s.muted, { fontSize: 12 }]}>{rejected ? 'Nothing to pay for this order.' : o.paymentStatus === 'collected' ? `✅ Paid (${o.collectedVia === 'upi' ? 'UPI' : 'cash'}) to the rider` : o.pay === 'UPI' ? 'Legacy demo order' : 'Pay the rider when it arrives'}</Text>
    </View>
    {backendConfig.backend === 'local' && next && !rejected && <Btn title={`Demo: advance to "${next.label}"`} onPress={() => api.setStatus(o.id, next.key)} />}
    <Text style={[s.muted, { marginTop: 6, fontSize: 12 }]}>{backendConfig.backend === 'local' ? 'Offline demo mode.' : '🟢 Live — updates from the store and rider appear here automatically.'}</Text>
  </ScrollView>;
}
