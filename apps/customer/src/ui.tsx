import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Product, rs, cartTotals } from '@porur/shared';
import { s, C, TA } from './theme';
import { useApp } from './store';

export function Qty({ p }: { p: Product }) {
  const { cart, setQty } = useApp(); const q = cart[p.id] || 0;
  if (!q) return <Pressable testID={'add-' + p.id} onPress={() => setQty(p.id, 1)} style={{ borderWidth:1.5, borderColor:C.green, borderRadius:10, paddingHorizontal:16, paddingVertical:6, backgroundColor:'#f0fdf4' }}><Text style={{ color:C.green, fontWeight:'800' }}>ADD</Text></Pressable>;
  return <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:C.green, borderRadius:10 }}>
    <Pressable onPress={() => setQty(p.id, q - 1)} style={{ padding:8 }}><Text style={{ color:'#fff', fontWeight:'800' }}>−</Text></Pressable>
    <Text style={{ color:'#fff', fontWeight:'800', minWidth:20, textAlign:'center' }}>{q}</Text>
    <Pressable onPress={() => setQty(p.id, q + 1)} style={{ padding:8 }}><Text style={{ color:'#fff', fontWeight:'800' }}>+</Text></Pressable></View>;
}
export function ProductRow({ p }: { p: Product & { inStock?: boolean } }) {
  return <View style={[s.card, { flexDirection:'row', alignItems:'center', gap:10, opacity: p.inStock === false ? 0.5 : 1 }]}>
    <View style={{ width:52, height:52, borderRadius:12, backgroundColor:'#f1f5f9', alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:28 }}>{p.emoji}</Text></View>
    <View style={{ flex:1 }}>
      <Text style={{ fontWeight:'700' }}>{p.name}{p.rx ? '  ' : ''}{p.rx && <Text style={{ color:'#b91c1c', fontSize:11 }}>Rx</Text>}</Text>
      <Text style={[s.muted, { fontFamily:TA }]}>{p.ta} · per {p.unit}</Text>
      <Text style={{ fontWeight:'800', marginTop:2 }}>{rs(p.price)}</Text></View>
    {p.inStock === false ? <Text style={s.muted}>Out of stock</Text> : <Qty p={p} />}
  </View>;
}
export function CartBar() {
  const { cart } = useApp(); const { lines, subtotal } = cartTotals(cart); if (!lines.length) return null;
  return <Pressable onPress={() => router.push('/cart')} style={{ position:'absolute', bottom:12, left:14, right:14, backgroundColor:C.green, borderRadius:14, padding:14, flexDirection:'row', justifyContent:'space-between' }}>
    <Text style={{ color:'#fff' }}>{lines.length} item(s) · {rs(subtotal)}</Text><Text style={{ color:'#fff', fontWeight:'800' }}>View cart →</Text></Pressable>;
}
export const Btn = ({ title, onPress, disabled, color, testID }: { title: string; onPress: () => void; disabled?: boolean; color?: string; testID?: string }) =>
  <Pressable testID={testID} onPress={disabled ? undefined : onPress} style={[s.btn, { backgroundColor: disabled ? '#9ca3af' : color || C.green }]}><Text style={s.btnTxt}>{title}</Text></Pressable>;
