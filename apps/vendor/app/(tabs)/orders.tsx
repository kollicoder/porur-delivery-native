import { sendPush, STATUS_TEXT } from '@porur/shared/src/ui/notify';
import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Order, OrderStatus, rs, PRODUCTS, RIDERS, PAY_LABEL } from '@porur/shared';
import { s, C } from '../../src/theme';
import { useVendor, api } from '../../src/store';
const LABEL: Partial<Record<OrderStatus, [string, string]>> = { placed: ['NEW', '#dc2626'], accepted: ['PREPARING', '#d97706'], ready: ['READY', '#2563eb'], picked_up: ['PICKED UP', '#16a34a'], on_the_way: ['PICKED UP', '#16a34a'], delivered: ['DONE', '#64748b'], rejected: ['REJECTED', '#64748b'] };
const mins = (iso: string) => Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
export default function Orders() {
  const { orders, refresh, store, riders } = useVendor(); const [note, setNote] = useState(''); const [tab, setTab] = useState<'active' | 'done'>('active');
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
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {(['active', 'done'] as const).map(t => <Pressable key={t} onPress={() => setTab(t)} style={[s.chip, tab === t && { backgroundColor: '#0f172a', borderColor: '#0f172a' }]}><Text style={{ color: tab === t ? '#fff' : C.dark, fontWeight: '700' }}>{t === 'active' ? 'Active' : 'Completed'}</Text></Pressable>)}
      <View style={{ flex: 1 }} /><Pressable testID="simulate" onPress={simulate} style={s.chip}><Text>＋ Simulate order</Text></Pressable></View>
    {!!note && <Text testID="dispatch-note" style={{ backgroundColor: '#ecfdf5', padding: 8, borderRadius: 8, marginTop: 8 }}>{note}</Text>}
    {!list.length && <Text style={[s.muted, { marginTop: 20 }]}>No orders here.</Text>}
    {list.map(o => { const [lbl, col] = LABEL[o.status] || [o.status, '#64748b']; const rxBlock = o.rxStatus === 'pending';
      return <View key={o.id} style={[s.card, { borderLeftWidth: 4, borderLeftColor: col }]}>
        <View style={s.row}><Text style={{ fontWeight: '800', fontSize: 16 }}>{o.id}</Text><Text style={{ color: col, fontWeight: '800' }}>{lbl}</Text></View>
        <Text style={s.muted}>{o.customer} · {mins(o.createdAt)} min ago · {PAY_LABEL[o.pay] ?? o.pay}</Text>
        {o.lines.map(l => <View key={l.productId} style={[s.row, { paddingVertical: 2 }]}><Text>{l.qty} × {l.name}{l.rx ? '  (Rx)' : ''}</Text><Text>{rs(l.price * l.qty)}</Text></View>)}
        <View style={[s.row, { borderTopWidth: 1, borderColor: C.line, marginTop: 6, paddingTop: 6 }]}><Text style={{ fontWeight: '800' }}>Item value</Text><Text style={{ fontWeight: '800' }}>{rs(o.subtotal)}</Text></View>
        {rxBlock && <Text style={{ color: '#b91c1c', marginTop: 6 }}>💊 Prescription needs pharmacist approval (Rx review tab)</Text>}
        {o.status === 'placed' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Pressable onPress={() => set(o, 'rejected')} style={[s.btn, { flex: 1, backgroundColor: '#fee2e2', marginTop: 0 }]}><Text style={{ color: '#991b1b', fontWeight: '800' }}>Reject</Text></Pressable>
          <Pressable testID={'accept-' + o.id} onPress={() => !rxBlock && set(o, 'accepted')} style={[s.btn, { flex: 2, marginTop: 0, backgroundColor: rxBlock ? '#9ca3af' : C.green }]}><Text style={s.btnTxt}>Accept</Text></Pressable></View>}
        {o.status === 'accepted' && <Pressable onPress={() => set(o, 'ready')} style={[s.btn, { backgroundColor: '#2563eb' }]}><Text style={s.btnTxt}>📦 Ready for pickup</Text></Pressable>}
        {o.status === 'ready' && <Text style={[s.muted, { marginTop: 8 }]}>📦 Packed. {o.rider ? `Waiting for rider ${rname(o.rider) ?? ''}…` : 'No rider yet — admin is assigning one.'}</Text>}
        {['picked_up', 'on_the_way', 'delivered'].includes(o.status) && <Text style={[s.muted, { marginTop: 8 }]}>🛵 {o.status === 'delivered' ? 'Delivered' : 'Picked up'} by {rname(o.rider) ?? 'rider'}</Text>}
      </View>; })}
  </ScrollView>;
}
