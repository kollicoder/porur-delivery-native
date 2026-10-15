import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CATEGORIES, STORES } from '@porur/shared';
import { K, F, Banner, SkeletonList } from '@porur/shared/src/ui/kit';
import { s } from '../../src/theme';
import { ProductCard, CartBar, tileColor } from '../../src/ui';
import { useApp } from '../../src/store';
export default function Category() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { products, productsReady } = useApp();
  const cat = CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; const store = STORES.find(x => x.cat === cat.id); const list = products.filter(p => p.cat === cat.id);
  return <View style={s.page}><Stack.Screen options={{ title: cat.label }} /><ScrollView contentContainerStyle={[s.pad, { paddingBottom: 110 }]}>
    <View style={{ backgroundColor: tileColor(cat.id), borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 24, color: K.ink }}>{cat.label}</Text><Text style={{ fontFamily: F.ta, color: K.ink2 }}>{cat.ta}</Text>
        {store && <Text style={{ fontFamily: F.bold, color: K.ink, marginTop: 6 }}>From {store.name} · {store.eta}</Text>}</View><Text style={{ fontSize: 48 }}>{cat.emoji}</Text></View>
    {cat.id === 'fv' && <Banner tone="info" icon="⚖️" title="Loose fruit and veg are weighed by the store" body="Tap + to pick how much in half-kilo steps." />}
    {cat.id === 'med' && <Banner tone="info" icon="💊" title="Rx medicines need a prescription photo" body="A licensed pharmacist checks every order." />}
    <View style={[s.row, { marginTop: 12, marginBottom: 6 }]}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>All items</Text><Text style={s.muted}>{list.length} items</Text></View>
    {!productsReady ? <SkeletonList testID="cat-loading" /> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>{list.map(p => <ProductCard key={p.id} p={p} />)}</View>}
  </ScrollView><CartBar bottom={16} /></View>;
}
