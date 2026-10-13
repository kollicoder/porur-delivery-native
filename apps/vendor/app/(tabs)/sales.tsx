import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { rs } from '@porur/shared';
import { s, C } from '../../src/theme';
import { useVendor } from '../../src/store';
const WEEK = [6200, 7400, 5900, 8100, 9300, 11800, 0];
export default function Sales() {
  const { orders, store } = useVendor(); const done = orders.filter(o => !['placed', 'rejected'].includes(o.status));
  const today = done.reduce((a, o) => a + o.subtotal, 0); const week = WEEK.map((v, i) => i === 6 ? today : v); const gross = week.reduce((a, b) => a + b, 0);
  const comm = gross * store!.commission / 100; const max = Math.max(...week, 1);
  const K = ({ l, v, sub }: { l: string; v: string; sub?: string }) => <View style={[s.card, { flex: 1 }]}><Text style={s.muted}>{l}</Text><Text style={{ fontSize: 20, fontWeight: '800' }}>{v}</Text>{sub && <Text style={{ fontSize: 11, color: C.green }}>{sub}</Text>}</View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <View style={{ flexDirection: 'row', gap: 8 }}><K l="Today's sales" v={rs(today)} sub={`${done.length} orders`} /><K l="Rejected" v={String(orders.filter(o => o.status === 'rejected').length)} /></View>
    <View style={s.card}><Text style={{ fontWeight: '800', marginBottom: 8 }}>Last 7 days</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 }}>{week.map((v, i) => <View key={i} style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ width: '100%', height: Math.max(4, (v / max) * 100), backgroundColor: i === 6 ? C.green : '#86efac', borderRadius: 4 }} /><Text style={{ fontSize: 10, color: C.muted }}>{['M', 'T', 'W', 'T', 'F', 'S', 'Today'][i]}</Text></View>)}</View></View>
    <View style={s.card}><Text style={{ fontWeight: '800', marginBottom: 6 }}>Weekly payout (Friday)</Text>
      <View style={s.row}><Text>Gross sales</Text><Text>{rs(gross)}</Text></View>
      <View style={s.row}><Text>Porur Delivery commission ({store!.commission}%)</Text><Text>− {rs(comm)}</Text></View>
      <View style={s.row}><Text>Cash already collected (COD)</Text><Text>− {rs(1850)}</Text></View>
      <View style={[s.row, { borderTopWidth: 1, borderColor: C.line, marginTop: 6, paddingTop: 6 }]}><Text style={{ fontWeight: '800' }}>You receive</Text><Text style={{ fontWeight: '800', color: C.green, fontSize: 18 }}>{rs(gross - comm - 1850)}</Text></View>
      <Text style={[s.muted, { fontSize: 11, marginTop: 4 }]}>Earlier days are sample numbers. Bank: XXXX 4421 (placeholder).</Text></View>
  </ScrollView>;
}
