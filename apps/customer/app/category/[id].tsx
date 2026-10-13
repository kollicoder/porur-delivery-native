import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, STORES } from '@porur/shared';
import { s } from '../../src/theme';
import { ProductRow, CartBar } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Category() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { products } = useApp();
  const cat = CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; const store = STORES.find(x => x.cat === cat.id);
  return <View style={s.page}><Stack.Screen options={{ title: cat.label }} /><ScrollView contentContainerStyle={s.pad}>
    {store && <View style={{ backgroundColor: '#ecfdf5', borderRadius: 10, padding: 10 }}><Text>{cat.emoji} From <Text style={{ fontWeight: '700' }}>{store.name}</Text> · {store.eta}</Text></View>}
    {cat.id === 'med' && <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 8 }}><Text>💡 Rx medicines need a prescription photo. A licensed pharmacist checks every order.</Text></View>}
    {products.filter(p => p.cat === cat.id).map(p => <ProductRow key={p.id} p={p} />)}
  </ScrollView><CartBar /></View>;
}
