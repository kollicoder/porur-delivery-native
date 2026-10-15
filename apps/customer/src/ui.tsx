import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Product, rs, cartTotals, CATEGORIES } from '@porur/shared';
import { K, F, Button, Stepper, TAP } from '@porur/shared/src/ui/kit';
import { useApp } from './store';
export { Button };
const TILE: Record<string, string> = { fv: '#DDF3E1', grocery: '#FFF1C7', med: '#E6DEFF', rider: '#FFDDE3' };
export const tileColor = (cat: string) => TILE[cat] || K.soft;

export function Qty({ p, compact }: { p: Product; compact?: boolean }) {
  const { cart, setQty } = useApp(); const q = cart[p.id] || 0;
  if (!q) return <Pressable testID={'add-' + p.id} accessibilityLabel={'Add ' + p.name} onPress={() => setQty(p.id, 1)}
    style={{ width: TAP, height: TAP, borderRadius: 24, backgroundColor: K.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 24, fontFamily: F.bold, marginTop: -2 }}>+</Text></Pressable>;
  return <Stepper testID={'qty-' + p.id} value={q} onChange={n => setQty(p.id, n)} unit={compact ? undefined : p.unit} />;
}
/** Grid tile (category / search) */
export function ProductCard({ p }: { p: Product & { inStock?: boolean } }) {
  const out = p.inStock === false;
  return <View testID={'card-' + p.id} style={{ width: '48.5%', backgroundColor: K.card, borderRadius: 22, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: K.line }}>
    <View style={{ height: 112, borderRadius: 16, backgroundColor: tileColor(p.cat), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 60, opacity: out ? 0.4 : 1 }}>{p.emoji}</Text>
      <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 11, fontFamily: F.bold, color: K.ink }}>By {p.unit}</Text></View>
      {p.rx && <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: K.redSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 11, fontFamily: F.bold, color: K.red }}>Rx</Text></View>}
    </View>
    <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 15, color: K.ink, marginTop: 8 }}>{p.name}</Text>
    <Text numberOfLines={1} style={{ fontFamily: F.ta, fontSize: 13, color: K.muted }}>{p.ta}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
      <View><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{rs(p.price)}</Text><Text style={{ fontSize: 11, color: K.muted, fontFamily: F.body }}>per {p.unit}</Text></View>
      {out ? <Text style={{ fontFamily: F.bold, color: K.red, fontSize: 12 }}>Out of stock</Text> : <Qty p={p} compact />}
    </View></View>;
}
/** List row (cart / search) with 48dp remove × */
export function ProductRow({ p, removable }: { p: Product & { inStock?: boolean }; removable?: boolean }) {
  const { setQty, cart } = useApp(); const out = p.inStock === false; const q = cart[p.id] || 0;
  return <View testID={'row-' + p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: K.card, borderRadius: 20, padding: 10, marginVertical: 5, borderWidth: 1, borderColor: out ? '#F3B6AE' : K.line }}>
    <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: tileColor(p.cat), alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32, opacity: out ? 0.4 : 1 }}>{p.emoji}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 15, color: K.ink }}>{p.name}{p.rx ? <Text style={{ color: K.red, fontSize: 12 }}>  Rx</Text> : null}</Text>
      <Text style={{ fontFamily: F.ta, fontSize: 13, color: K.muted }}>{p.ta} · ₹{p.price}/{p.unit}</Text>
      {out ? <Text style={{ color: K.red, fontFamily: F.bold, fontSize: 13, marginTop: 4 }}>Out of stock — not charged</Text>
        : <Text style={{ fontFamily: F.display, fontSize: 16, color: K.ink, marginTop: 2 }}>{rs(p.price * Math.max(q, 1))}</Text>}
    </View>
    {out ? null : <Qty p={p} compact />}
    {removable && <Pressable testID={'remove-' + p.id} accessibilityLabel={'Remove ' + p.name} onPress={() => setQty(p.id, 0)} style={{ width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20, color: K.muted, fontFamily: F.bold }}>✕</Text></Pressable>}
  </View>;
}
export function CartBar({ bottom = 90 }: { bottom?: number }) {
  const { cart, products, settings } = useApp(); const { lines, subtotal } = cartTotals(cart, products, settings); if (!lines.length) return null;
  return <Pressable testID="cart-bar" onPress={() => router.push('/cart')} style={{ position: 'absolute', bottom, left: 16, right: 16, backgroundColor: K.yellow, borderRadius: 999, minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text style={{ color: K.ink, fontFamily: F.bold }}>{lines.length} item{lines.length > 1 ? 's' : ''} · {rs(subtotal)}</Text><Text style={{ color: K.ink, fontFamily: F.bold }}>View cart →</Text></Pressable>;
}
/** Back-compat wrapper used by older screens */
export const Btn = ({ title, onPress, disabled, color, testID, reason, onLockedPress }: { title: string; onPress: () => void; disabled?: boolean; color?: string; testID?: string; reason?: string; onLockedPress?: () => void }) =>
  <Button testID={testID} title={title} onPress={onPress} disabled={disabled} reason={reason} onLockedPress={onLockedPress} kind={color === 'primary' ? 'primary' : 'dark'} style={{ marginTop: 12 }} />;
export const catOf = (id: string) => CATEGORIES.find(c => c.id === id);
