import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Switch } from 'react-native';
import { rs } from '@porur/shared';
import { s, C, TA, K, F } from '../../src/theme';
import { TAP } from '@porur/shared/src/ui/kit';
import { useVendor, useProducts, api } from '../../src/store';
export default function Catalogue() {
  const { refresh } = useVendor(); const products = useProducts(); const [edit, setEdit] = useState<string>(); const [val, setVal] = useState('');
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.muted}>{products.filter(p => p.inStock).length}/{products.length} items in stock. Price and stock changes show in the customer app instantly.</Text>
    {products.map(p => <View key={p.id} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: K.soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>{p.emoji}</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink, fontSize: 15 }}>{p.name}</Text><Text style={[s.muted, { fontFamily: TA }]}>{p.ta} · per {p.unit}</Text>
        {edit === p.id ? <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <Text>₹</Text><TextInput style={[s.input, { width: 80, padding: 6 }]} value={val} onChangeText={setVal} keyboardType="numeric" autoFocus />
          <Pressable onPress={async () => { const n = parseFloat(val); if (n > 0) await api.updateProduct(p.id, { price: n }); setEdit(undefined); refresh(); }} style={[s.chip, { backgroundColor: K.ink, borderColor: K.ink, marginBottom: 0 }]}><Text style={{ color: '#fff', fontFamily: F.bold }}>Save</Text></Pressable></View>
          : <Pressable testID={'edit-' + p.id} accessibilityLabel={'Edit price of ' + p.name} onPress={() => { setEdit(p.id); setVal(String(p.price)); }} style={{ minHeight: TAP, justifyContent: 'center' }}><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{rs(p.price)}  <Text style={{ fontFamily: F.bold, fontSize: 14, textDecorationLine: 'underline' }}>✎ Edit price</Text></Text></Pressable>}
      </View>
      <View style={{ alignItems: 'center' }}><Switch value={p.inStock} onValueChange={async v => { await api.updateProduct(p.id, { inStock: v }); refresh(); }} trackColor={{ true: K.green, false: '#B7B3A8' }} thumbColor="#fff" accessibilityLabel={p.name + ' in stock'} />
        <Text style={{ fontSize: 12, fontFamily: F.bold, color: p.inStock ? K.green : K.red }}>{p.inStock ? 'In stock' : 'Out of stock'}</Text></View>
    </View>)}
  </ScrollView>;
}
