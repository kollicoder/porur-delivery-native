import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { router } from 'expo-router';
import { cartTotals, productById, rs, MIN_ORDER, FREE_DELIVERY_ABOVE } from '@porur/shared';
import { s, C } from '../../src/theme';
import { ProductRow, Btn } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Cart() {
  const { cart } = useApp(); const { lines, subtotal, fee, total } = cartTotals(cart); const short = MIN_ORDER - subtotal;
  if (!lines.length) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}><Text style={{ fontSize: 48 }}>🛒</Text><Text style={s.muted}>Your cart is empty</Text><Btn title="🎤 Order by voice" onPress={() => router.push('/voice')} /></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    {lines.map(l => <ProductRow key={l.productId} p={productById(l.productId)!} />)}
    <View style={s.card}>
      <View style={s.row}><Text>Item total</Text><Text>{rs(subtotal)}</Text></View>
      <View style={[s.row, { marginTop: 6 }]}><Text>Delivery fee</Text><Text style={{ color: fee ? C.dark : C.green, fontWeight: '700' }}>{fee ? rs(fee) : 'FREE'}</Text></View>
      <View style={[s.row, { marginTop: 8, borderTopWidth: 1, borderColor: C.line, paddingTop: 8 }]}><Text style={{ fontWeight: '800', fontSize: 16 }}>To pay</Text><Text style={{ fontWeight: '800', fontSize: 16 }}>{rs(total)}</Text></View>
      {fee > 0 && <Text style={s.muted}>Add {rs(FREE_DELIVERY_ABOVE - subtotal)} more for free delivery</Text>}
    </View>
    {short > 0 ? <View style={{ backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginTop: 8 }}><Text>Minimum order is {rs(MIN_ORDER)}. Add {rs(short)} more.</Text></View>
      : <Btn testID="to-checkout" title="Proceed to checkout →" onPress={() => router.push('/checkout')} />}
  </ScrollView>;
}
