import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { cartTotals, rs, STORES } from '@porur/shared';
import { K, F, Card, Banner, Empty } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { ProductRow, Btn } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Cart() {
  const { cart, products, settings, setQty } = useApp(); const { lines, subtotal, fee, total, min, free, needsRx } = cartTotals(cart, products, settings); const short = min - subtotal;
  const inCart = Object.keys(cart).map(id => products.find(p => p.id === id)).filter(Boolean) as typeof products;
  const outOfStock = inCart.filter(p => p.inStock === false);
  if (!inCart.length) return <View style={[s.page, { justifyContent: 'center' }]}><Empty testID="cart-empty" emoji="🧺" title="Your cart is empty" body="Add something from the shelves, or just say your list." action="🎤 Order by voice" onAction={() => router.push('/voice')} /></View>;
  const byStore = STORES.map(st => ({ st, items: inCart.filter(p => p.store === st.id) })).filter(g => g.items.length);
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={{ fontSize: 20 }}>🏠</Text><View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>Home</Text><Text numberOfLines={1} style={s.muted}>Flat 2A, Sri Sai Apartments, Mount-Poonamallee Rd</Text></View>
      <Pressable testID="cart-change-addr" onPress={() => router.push('/checkout')} style={{ minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: F.bold, color: K.ink, textDecorationLine: 'underline' }}>Change</Text></Pressable></Card>
    {fee > 0 && <Banner tone="ok" icon="🛵" title={`Add ${rs(free - subtotal)} more for free delivery`} />}
    {needsRx && <Banner tone="warn" icon="📄" title="1 item needs a prescription" body="Add a photo at checkout. A pharmacist checks it first." />}
    {!!outOfStock.length && <Banner testID="oos-banner" tone="error" icon="⚠️" title={`${outOfStock.length} item${outOfStock.length > 1 ? 's' : ''} went out of stock`} body="They're not counted in your total." action="Remove" onAction={() => outOfStock.forEach(p => setQty(p.id, 0))} />}
    {byStore.map(({ st, items }) => <View key={st.id}>
      <View style={[s.row, { marginTop: 14, marginBottom: 2 }]}><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{st.name}</Text><Text style={s.muted}>{st.eta}</Text></View>
      {items.map(p => <ProductRow key={p.id} p={p} removable />)}</View>)}
    <Card testID="cart-bill">
      <View style={s.row}><Text style={{ fontFamily: F.body, color: K.ink }}>Item total</Text><Text style={{ fontFamily: F.bold, color: K.ink }}>{rs(subtotal)}</Text></View>
      <View style={[s.row, { marginTop: 6 }]}><Text style={{ fontFamily: F.body, color: K.ink }}>Delivery fee{byStore.length > 1 ? ' (charged once)' : ''}</Text><Text style={{ color: fee ? K.ink : K.green, fontFamily: F.bold }}>{fee ? rs(fee) : 'FREE'}</Text></View>
      <View style={[s.row, { marginTop: 8, borderTopWidth: 1, borderColor: K.line, paddingTop: 8 }]}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>To pay</Text><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{rs(total)}</Text></View>
      <Text style={[s.muted, { marginTop: 4 }]}>💵 Pay on delivery · cash or UPI</Text>
    </Card>
    {short > 0 ? <Banner tone="warn" icon="🧾" title={`Minimum order is ${rs(min)}`} body={`Add ${rs(short)} more to check out.`} />
      : <Btn testID="to-checkout" title="Proceed to checkout →" onPress={() => router.push('/checkout')} />}
  </ScrollView>;
}
