import React, { useCallback } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { rs, CUSTOMER_STEPS, STORES } from '@porur/shared';
import { s } from '../../src/theme';
import { useApp } from '../../src/store';
export default function Orders() {
  const { orders, refresh } = useApp(); useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  if (!orders.length) return <View style={[s.page, { alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 48 }}>📦</Text><Text style={s.muted}>No orders yet</Text></View>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>{orders.map(o =>
    <Pressable key={o.id} style={s.card} onPress={() => router.push(`/order/${o.id}`)}>
      <View style={s.row}><Text style={{ fontWeight: '800' }}>{o.type === 'errand' ? '🛵' : '📦'} {o.id}</Text><Text style={{ color: '#15803d', fontWeight: '700' }}>{CUSTOMER_STEPS.find(x => x.key === o.status)?.label ?? o.status}</Text></View>
      <Text style={s.muted}>{o.type === 'errand' ? o.note : STORES.find(x => x.id === o.storeId)?.name} · {rs(o.total)}</Text></Pressable>)}</ScrollView>;
}
