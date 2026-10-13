import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Switch } from 'react-native';
import { rs } from '@porur/shared';
import { s, C, TA } from '../../src/theme';
import { useVendor, useProducts, api } from '../../src/store';
export default function Catalogue() {
  const { refresh } = useVendor(); const products = useProducts(); const [edit, setEdit] = useState<string>(); const [val, setVal] = useState('');
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.muted}>{products.filter(p => p.inStock).length}/{products.length} items in stock. Price and stock changes show in the customer app instantly.</Text>
    {products.map(p => <View key={p.id} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
      <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
      <View style={{ flex: 1 }}><Text style={{ fontWeight: '700' }}>{p.name}</Text><Text style={[s.muted, { fontFamily: TA }]}>{p.ta} · per {p.unit}</Text>
        {edit === p.id ? <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
          <Text>₹</Text><TextInput style={[s.input, { width: 80, padding: 6 }]} value={val} onChangeText={setVal} keyboardType="numeric" autoFocus />
          <Pressable onPress={async () => { const n = parseFloat(val); if (n > 0) await api.updateProduct(p.id, { price: n }); setEdit(undefined); refresh(); }} style={[s.chip, { backgroundColor: C.green, borderColor: C.green, marginBottom: 0 }]}><Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text></Pressable></View>
          : <Pressable onPress={() => { setEdit(p.id); setVal(String(p.price)); }}><Text style={{ fontWeight: '800', marginTop: 2 }}>{rs(p.price)} <Text style={{ color: '#2563eb', fontWeight: '400' }}>✎ edit</Text></Text></Pressable>}
      </View>
      <View style={{ alignItems: 'center' }}><Switch value={p.inStock} onValueChange={async v => { await api.updateProduct(p.id, { inStock: v }); refresh(); }} trackColor={{ true: '#86efac' }} thumbColor={p.inStock ? C.green : '#f4f4f5'} />
        <Text style={{ fontSize: 11, color: p.inStock ? C.green : C.muted }}>{p.inStock ? 'In stock' : 'Out'}</Text></View>
    </View>)}
  </ScrollView>;
}
