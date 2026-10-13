import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CUSTOMER_STEPS, rs, STORES, backendConfig, HUB, PAY_LABEL } from '@porur/shared';
import { MapView } from '@porur/shared/src/ui/MapView';
import { s, C } from '../../src/theme';
import { Btn } from '../../src/ui';
import { api, useApp } from '../../src/store';
export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { orders, riders } = useApp(); const o = orders.find(x => x.id === id);
  const [otp, setOtp] = useState<string | null>(null); useEffect(() => api.watchSecret ? api.watchSecret(id!, setOtp) : undefined, [id]);
  if (!o) return <View style={s.page}><Text style={[s.muted, { padding: 20 }]}>Loading order…</Text></View>;
  const rider = riders.find(r => r.id === o.rider); const store = STORES.find(x => x.id === o.storeId);
  const idx = Math.max(0, CUSTOMER_STEPS.findIndex(x => x.key === o.status));
  const next = CUSTOMER_STEPS[idx + 1];
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <MapView testID="track-map" height={220} pins={[
      ...(store ? [{ lat: store.lat, lng: store.lng, emoji: '🏪', label: store.name.split(' ')[0] }] : []),
      { lat: o.dropLat ?? HUB.lat + 0.01, lng: o.dropLng ?? HUB.lng + 0.01, emoji: '🏠', label: 'You' },
      ...(rider?.lat && idx >= 1 && o.status !== 'delivered' ? [{ lat: rider.lat, lng: rider.lng!, emoji: '🛵', label: rider.name }] : []),
    ]} />
    <View style={s.card} testID="track-card">
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#15803d', marginBottom: 8 }}>{o.status === 'delivered' ? 'Delivered 🎉' : `Arriving in ~${Math.max(5, 30 - idx * 5)} min`}</Text>
      {CUSTOMER_STEPS.map((st, i) => <View key={st.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: i <= idx ? C.green : '#d1d5db', backgroundColor: i <= idx ? C.green : '#fff' }} />
        <Text style={{ color: i <= idx ? C.dark : '#9ca3af', fontWeight: i <= idx ? '700' : '400' }}>{st.label}</Text></View>)}
      {o.rxStatus && <Text style={{ marginTop: 6 }}>💊 Prescription: <Text style={{ fontWeight: '700' }}>{o.rxStatus}</Text></Text>}
    </View>
    {o.status !== 'delivered' && o.status !== 'rejected' && <View style={s.card} testID="otp-card"><Text style={{ fontWeight: '800' }}>Delivery OTP: <Text style={{ letterSpacing: 3, backgroundColor: C.dark, color: '#fff' }}> {otp ?? o.otp ?? '····'} </Text></Text><Text style={s.muted}>Only you can see this code. Tell it to the rider when you receive the order.</Text></View>}
    <View style={s.card}>
      <Text style={{ fontWeight: '700', marginBottom: 4 }}>{o.type === 'errand' ? '🛵 Errand' : STORES.find(x => x.id === o.storeId)?.name}</Text>
      {o.parts && o.parts > 1 && <Text style={[s.muted, { fontSize: 12 }]}>Part {o.part} of {o.parts} from one checkout (one order per store)</Text>}
      {o.type === 'errand' ? <Text>{o.note}</Text> : o.lines.map(l => <View key={l.productId} style={s.row}><Text style={{ flex: 1 }}>{l.name} × {l.qty}</Text><Text>{rs(l.price * l.qty)}</Text></View>)}
      {o.type !== 'errand' && <><View style={[s.row, { marginTop: 6, borderTopWidth: 1, borderColor: C.line, paddingTop: 6 }]}><Text>Item total</Text><Text>{rs(o.subtotal)}</Text></View>
        <View style={s.row}><Text>Delivery fee</Text><Text>{o.fee ? rs(o.fee) : (o.parts && o.part! > 1 ? 'on part 1' : 'FREE')}</Text></View>
        {!!o.feeNote && <Text style={[s.muted, { fontSize: 12 }]}>{o.feeNote}</Text>}</>}
      <View style={[s.row, { marginTop: 6 }]} testID="order-total"><Text style={{ fontWeight: '800' }}>Total · {PAY_LABEL[o.pay] ?? o.pay}</Text><Text style={{ fontWeight: '800' }}>{rs(o.total)}</Text></View>
      <Text style={[s.muted, { fontSize: 12 }]}>{o.paymentStatus === 'collected' ? `✅ Paid (${o.collectedVia === 'upi' ? 'UPI' : 'cash'}) to the rider` : o.pay === 'UPI' ? 'Legacy demo order' : 'Pay the rider when it arrives'}</Text>
    </View>
    {o.status === 'rejected' && <View style={[s.card, { backgroundColor: '#fee2e2' }]}><Text>❌ The store couldn't take this order. Nothing to pay.</Text></View>}
    {rider && <View style={s.card}><Text>🧑 <Text style={{ fontWeight: '800' }}>{rider.name}</Text> is your rider · 📞 {rider.phone}</Text></View>}
    {backendConfig.backend === 'local' && next && <Btn title={`Demo: advance to "${next.label}"`} color="#64748b" onPress={() => api.setStatus(o.id, next.key)} />}
    <Text style={[s.muted, { marginTop: 6, fontSize: 12 }]}>{backendConfig.backend === 'local' ? 'Offline demo mode.' : '🟢 Live — updates from the store and rider appear here automatically.'}</Text>
  </ScrollView>;
}
