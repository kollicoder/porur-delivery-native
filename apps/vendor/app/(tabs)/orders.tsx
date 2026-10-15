import { sendPush, STATUS_TEXT } from '@porur/shared/src/ui/notify';
import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { K, F, Button, Pill, SkeletonList, Empty, Segmented, Banner } from '@porur/shared/src/ui/kit';
import { isTestMode } from '@porur/shared';
import { Order, OrderStatus, rs, PRODUCTS, RIDERS, PAY_LABEL } from '@porur/shared';
import { s, C } from '../../src/theme';
import { useVendor, api } from '../../src/store';
const LABEL: Partial<Record<OrderStatus, [string, string, string]>> = { placed: ['NEW', K.redSoft, K.red], accepted: ['PREPARING', K.yellowSoft, '#5C4300'], ready: ['READY', K.blueSoft, K.blue], picked_up: ['PICKED UP', K.greenSoft, '#14532D'], on_the_way: ['PICKED UP', K.greenSoft, '#14532D'], delivered: ['DONE', K.soft, K.muted], rejected: ['REJECTED', K.soft, K.muted] };
const mins = (iso: string) => Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
export default function Orders() {
  const { orders, refresh, store, riders, ordersReady } = useVendor(); const [note, setNote] = useState(''); const [tab, setTab] = useState<'active' | 'done'>('active');
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const rname = (id?: string) => riders.find(r => r.id === id)?.name ?? RIDERS.find(r => r.id === id)?.name;
  const set = async (o: Order, st: OrderStatus) => {
    try {
      if (st === 'accepted') { const r = await api.acceptOrder(o, riders, store); setNote(r ? `${o.id}: rider ${rname(r)} assigned automatically` : `${o.id}: no rider online — the admin will assign one`);
        if (r) api.pushTo({ riderId: r }, '🛵 New pickup ' + o.id, `${store!.name} · ${o.address}`); }
      else { await api.setStatus(o.id, st); if (st === 'ready' && o.rider) api.pushTo({ riderId: o.rider }, `📦 ${o.id} is packed`, `Pick up at ${store!.name}`); }
      if (o.customerPushToken) sendPush(o.customerPushToken, `Order ${o.id}`, STATUS_TEXT[st] || st).catch(() => {});
    } catch (e: any) { setNote('⚠️ ' + (e?.message || e)); }
    refresh(); };
  const simulate = async () => {
    const ps = PRODUCTS.filter(p => p.store === store!.id && !p.rx).slice(0, 3); const lines = ps.map(p => ({ productId: p.id, name: p.name, qty: 2, price: p.price }));
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
    await api.createOrders([{ id: 'PD' + Math.floor(2000 + Math.random() * 7000), type: 'order', storeId: store!.id, customer: 'Walk-in demo', phone: '90000 00000', address: 'Porur', lines, subtotal, fee: 0, total: subtotal, pay: 'COD', paymentStatus: 'due', status: 'placed', createdAt: new Date().toISOString() }]); refresh();
  };
  const list = orders.filter(o => tab === 'active' ? !['delivered', 'rejected', 'picked_up', 'on_the_way'].includes(o.status) : ['delivered', 'rejected', 'picked_up', 'on_the_way'].includes(o.status));
  const nActive = orders.filter(o => !['delivered', 'rejected', 'picked_up', 'on_the_way'].includes(o.status)).length;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Segmented value={tab} onChange={setTab} options={[['active', `Active (${nActive})`], ['done', 'Completed']] as const} />
    {isTestMode(api.emulator) && <Pressable testID="simulate" onPress={simulate} style={[s.chip, { alignSelf: 'flex-end', marginTop: 8 }]}><Text style={{ fontFamily: F.bold, color: K.ink }}>＋ Simulate order (test)</Text></Pressable>}
    {!!note && <Text testID="dispatch-note" style={{ backgroundColor: note.startsWith('⚠️') ? K.redSoft : K.greenSoft, color: K.ink, fontFamily: F.bold, padding: 12, borderRadius: 14, marginTop: 8 }}>{note}</Text>}
    {!ordersReady ? <SkeletonList testID="orders-loading" /> : !list.length && <Empty emoji={tab === 'active' ? '🛎️' : '✅'} title={tab === 'active' ? 'No new orders' : 'Nothing completed yet'} body={tab === 'active' ? 'Keep the app open — new orders ring here.' : undefined} />}
    {list.map(o => { const [lbl, bg, fg] = LABEL[o.status] || [o.status, K.soft, K.muted]; const rxBlock = o.rxStatus === 'pending'; const age = mins(o.createdAt);
      return <View key={o.id} testID={'vorder-' + o.id} style={[s.card, o.status === 'placed' && { borderColor: K.ink, borderWidth: 2 }]}>
        <View style={s.row}><Text style={{ fontFamily: F.display, fontSize: 20, color: K.ink }}>{o.id}</Text><Pill label={lbl} bg={bg} fg={fg} /></View>
        <Text style={[s.muted, { marginTop: 2 }]}>{o.customer} · {age} min ago · {PAY_LABEL[o.pay] ?? o.pay}</Text>
        {o.status === 'placed' && <><Text style={{ fontFamily: F.bold, color: age >= 3 ? K.red : K.green, marginTop: 6 }}>{age >= 3 ? 'Accept now — customer is waiting' : `Accept within ${3 - age} min`}</Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: K.soft, marginTop: 4 }}><View style={{ height: 6, borderRadius: 3, width: `${Math.max(5, 100 - (age / 3) * 100)}%`, backgroundColor: age >= 3 ? K.red : K.green }} /></View></>}
        {o.lines.map(l => <View key={l.productId} style={[s.row, { paddingVertical: 6, gap: 10 }]}>
          <View style={{ backgroundColor: K.ink, borderRadius: 10, minWidth: 40, paddingVertical: 4, alignItems: 'center' }}><Text style={{ color: '#fff', fontFamily: F.bold }}>× {l.qty}</Text></View>
          <Text style={{ flex: 1, fontFamily: F.bold, color: K.ink }}>{l.name}{l.rx ? '  (Rx)' : ''}</Text><Text style={{ fontFamily: F.body, color: K.ink }}>{rs(l.price * l.qty)}</Text></View>)}
        <View style={[s.row, { borderTopWidth: 1, borderColor: K.line, marginTop: 6, paddingTop: 8 }]}><Text style={{ fontFamily: F.bold, color: K.ink }}>Item value</Text><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{rs(o.subtotal)}</Text></View>
        {o.status === 'placed' && <View style={{ marginTop: 10 }}>
          {rxBlock && <Pressable testID={'rx-reason-' + o.id} onPress={() => router.push('/rx')} style={{ backgroundColor: K.orangeSoft, borderColor: '#F5B48F', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, minHeight: 48 }}>
            <Text style={{ fontFamily: F.bold, color: '#7A2E0B' }}>💊 Approve the prescription before accepting</Text><Text style={{ fontFamily: F.bold, color: '#7A2E0B', textDecorationLine: 'underline', marginTop: 2 }}>Open Rx review →</Text></Pressable>}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button testID={'reject-' + o.id} kind="danger" title="Reject" onPress={() => set(o, 'rejected')} style={{ flex: 1 }} />
            <Button testID={'accept-' + o.id} kind="dark" title="Accept" icon="✓" disabled={rxBlock} onLockedPress={() => router.push('/rx')} onPress={() => set(o, 'accepted')} style={{ flex: 2 }} /></View></View>}
        {o.status === 'accepted' && <Button kind="primary" title="📦 Ready for pickup" onPress={() => set(o, 'ready')} style={{ marginTop: 12 }} />}
        {o.status === 'ready' && <Banner tone="info" icon="📦" title="Packed" body={o.rider ? `Waiting for rider ${rname(o.rider) ?? ''}…` : 'No rider yet — admin is assigning one.'} />}
        {['picked_up', 'on_the_way', 'delivered'].includes(o.status) && <Text style={[s.muted, { marginTop: 8 }]}>🛵 {o.status === 'delivered' ? 'Delivered' : 'Picked up'} by {rname(o.rider) ?? 'rider'}</Text>}
      </View>; })}
  </ScrollView>;
}
