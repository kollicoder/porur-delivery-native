import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable, Image } from 'react-native';
import { s, C, K, F } from '../../src/theme';
import { Button, Banner, Pill, Empty } from '@porur/shared/src/ui/kit';
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
    <Banner tone="info" icon="👩‍⚕️" title="Only the registered pharmacist should approve" body="Check: patient name · doctor name and registration · date (not older than 6 months) · medicine and dosage match · not a restricted (Schedule X) drug." />
    {!q.length && <Empty emoji="💊" title="No prescriptions to review" />}
    {q.map(o => <View key={o.id} style={s.card}>
      <View style={s.row}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{o.id} · {o.customer}</Text><Pill label={o.rxStatus!.toUpperCase()} bg={o.rxStatus === 'pending' ? K.yellowSoft : o.rxStatus === 'approved' ? K.greenSoft : K.redSoft} fg={o.rxStatus === 'pending' ? '#5C4300' : o.rxStatus === 'approved' ? '#14532D' : K.red} /></View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        <RxPhoto id={o.id} legacy={o.prescriptionUri} />
        <View style={{ flex: 1 }}>{o.lines.filter(l => l.rx).map(l => <Text key={l.productId} style={{ fontFamily: F.bold, color: K.ink }}>💊 {l.name} × {l.qty}</Text>)}
          <Text style={s.muted}>Also: {o.lines.filter(l => !l.rx).map(l => l.name).join(', ') || '—'}</Text></View></View>
      {o.rxStatus === 'pending' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Button kind="danger" title="Reject" onPress={() => set(o.id, 'rejected')} style={{ flex: 1 }} />
        <Button testID={'approve-' + o.id} kind="dark" title="✓ Approve" onPress={() => set(o.id, 'approved')} style={{ flex: 2 }} /></View>}
    </View>)}
  </ScrollView>;
}
