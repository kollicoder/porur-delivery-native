import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import { s, C } from '../../src/theme';
import { useVendor, api } from '../../src/store';
/** Prescription photo lives in prescriptions/{orderId} (readable by this store's vendor, the customer and admin — not riders). */
function RxPhoto({ id, legacy }: { id: string; legacy?: string }) {
  const [img, setImg] = useState<string | null>(null); useEffect(() => api.watchPrescription(id, setImg), [id]);
  const src = img || (legacy && legacy !== 'sample' ? legacy : null);
  return src ? <Image source={{ uri: src }} style={{ width: 90, height: 110, borderRadius: 8 }} />
    : <View style={{ width: 90, height: 110, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 30 }}>📄</Text><Text style={{ fontSize: 10, color: C.muted }}>no photo</Text></View>;
}
export default function Rx() {
  const { orders, refresh } = useVendor(); const q = orders.filter(o => o.rxStatus);
  const set = async (id: string, rx: 'approved' | 'rejected') => { await api.updateOrder(id, { rxStatus: rx, ...(rx === 'rejected' ? { status: 'rejected' as const } : {}) }); refresh(); };
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10 }}><Text>👩‍⚕️ Only the registered pharmacist should approve. Check patient name, doctor, date, dosage and that the medicine is not a restricted drug.</Text></View>
    {!q.length && <Text style={[s.muted, { marginTop: 16 }]}>No prescriptions.</Text>}
    {q.map(o => <View key={o.id} style={s.card}>
      <View style={s.row}><Text style={{ fontWeight: '800' }}>{o.id} · {o.customer}</Text><Text style={{ fontWeight: '700', color: o.rxStatus === 'pending' ? '#d97706' : o.rxStatus === 'approved' ? C.green : '#b91c1c' }}>{o.rxStatus?.toUpperCase()}</Text></View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <RxPhoto id={o.id} legacy={o.prescriptionUri} />
        <View style={{ flex: 1 }}>{o.lines.filter(l => l.rx).map(l => <Text key={l.productId} style={{ fontWeight: '700' }}>💊 {l.name} × {l.qty}</Text>)}
          <Text style={s.muted}>Also: {o.lines.filter(l => !l.rx).map(l => l.name).join(', ') || '—'}</Text></View></View>
      {o.rxStatus === 'pending' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Pressable onPress={() => set(o.id, 'rejected')} style={[s.btn, { flex: 1, backgroundColor: '#fee2e2', marginTop: 0 }]}><Text style={{ color: '#991b1b', fontWeight: '800' }}>Reject</Text></Pressable>
        <Pressable testID={'approve-' + o.id} onPress={() => set(o.id, 'approved')} style={[s.btn, { flex: 2, marginTop: 0 }]}><Text style={s.btnTxt}>✓ Approve</Text></Pressable></View>}
    </View>)}
  </ScrollView>;
}
