import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CUSTOMER_STEPS, rs, STORES, backendConfig, HUB } from '@porur/shared';
import { MapView } from '@porur/shared/src/ui/MapView';
import { s, C } from '../../src/theme';
import { Btn } from '../../src/ui';
import { api, useApp } from '../../src/store';
export default function Track() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { orders, riders } = useApp(); const o = orders.find(x => x.id === id);
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
    <View style={s.card}><Text style={{ fontWeight: '800' }}>Delivery OTP: <Text style={{ letterSpacing: 3, backgroundColor: C.dark, color: '#fff' }}> {o.otp} </Text></Text><Text style={s.muted}>Share with the rider only at delivery.</Text></View>
    <View style={s.card}>
      <Text style={{ fontWeight: '700', marginBottom: 4 }}>{o.type === 'errand' ? '🛵 Errand' : STORES.find(x => x.id === o.storeId)?.name}</Text>
      {o.type === 'errand' ? <Text>{o.note}</Text> : o.lines.map(l => <View key={l.productId} style={s.row}><Text>{l.name}</Text><Text>×{l.qty}</Text></View>)}
      <View style={[s.row, { marginTop: 6 }]}><Text style={{ fontWeight: '800' }}>Total ({o.pay})</Text><Text style={{ fontWeight: '800' }}>{rs(o.total)}</Text></View>
    </View>
    {o.status === 'rejected' && <View style={[s.card, { backgroundColor: '#fee2e2' }]}><Text>❌ The store couldn't take this order. Any UPI payment will be refunded (mock).</Text></View>}
    {rider && <View style={s.card}><Text>🧑 <Text style={{ fontWeight: '800' }}>{rider.name}</Text> is your rider · 📞 {rider.phone}</Text></View>}
    {backendConfig.backend === 'local' && next && <Btn title={`Demo: advance to "${next.label}"`} color="#64748b" onPress={() => api.setStatus(o.id, next.key)} />}
    <Text style={[s.muted, { marginTop: 6, fontSize: 12 }]}>{backendConfig.backend === 'local' ? 'Offline demo mode.' : '🟢 Live — updates from the store and rider appear here automatically.'}</Text>
  </ScrollView>;
}
