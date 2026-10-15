import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { rs, CUSTOMER_STEPS, STORES } from '@porur/shared';
import { K, F, SkeletonList, Empty, Pill } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { useApp } from '../../src/store';
export default function Orders() {
  const { orders, ordersReady } = useApp();
  if (!ordersReady) return <View style={[s.page, s.pad]}><SkeletonList testID="orders-loading" /></View>;
  if (!orders.length) return <View style={[s.page, { justifyContent: 'center' }]}><Empty emoji="📦" title="No orders yet" body="Your orders and errands will show here." action="Start shopping" onAction={() => router.replace('/')} /></View>;
  const active = orders.filter(o => !['delivered', 'rejected'].includes(o.status)); const past = orders.filter(o => ['delivered', 'rejected'].includes(o.status));
  const Row = ({ o }: { o: typeof orders[0] }) => { const rej = o.status === 'rejected'; const label = rej ? (o.rxStatus === 'rejected' ? 'Cancelled' : 'Store rejected') : CUSTOMER_STEPS.find(x => x.key === o.status)?.label ?? o.status;
    return <Pressable testID={'order-' + o.id} onPress={() => router.push(`/order/${o.id}`)} style={[s.card, { minHeight: 72, backgroundColor: !rej && o.status !== 'delivered' ? K.ink : K.card }]}>
      {(() => { const dark = !rej && o.status !== 'delivered'; const fg = dark ? '#fff' : K.ink; return <>
      <View style={s.row}><Text style={{ fontFamily: F.display, fontSize: 17, color: fg }}>{o.type === 'errand' ? '🛵' : '📦'} {o.id}</Text>
        <Pill label={label} bg={rej ? K.redSoft : o.status === 'delivered' ? K.greenSoft : K.yellow} fg={rej ? K.red : o.status === 'delivered' ? '#14532D' : K.ink} /></View>
      <Text style={{ fontFamily: F.body, color: dark ? '#E9E4D8' : K.muted, marginTop: 4 }}>{o.type === 'errand' ? o.note : STORES.find(x => x.id === o.storeId)?.name} · {rs(o.total)}</Text>
      {dark && <Text style={{ fontFamily: F.bold, color: K.yellow, marginTop: 6 }}>Track →</Text>}</>; })()}</Pressable>; };
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    {!!active.length && <Text style={s.h3}>On the way</Text>}{active.map(o => <Row key={o.id} o={o} />)}
    {!!past.length && <Text style={s.h3}>Past orders</Text>}{past.map(o => <Row key={o.id} o={o} />)}
  </ScrollView>;
}
