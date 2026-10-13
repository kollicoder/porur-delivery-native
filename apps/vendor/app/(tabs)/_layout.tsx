import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, Pressable } from 'react-native';
import { useVendor } from '../../src/store';
const I = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;
export default function L() {
  const { store, ready, setStoreId, orders } = useVendor(); if (!ready) return null; if (!store) return <Redirect href="/" />;
  const newCount = orders.filter(o => o.status === 'placed').length; const rxCount = orders.filter(o => o.rxStatus === 'pending').length;
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff', tabBarActiveTintColor: '#16a34a', headerTitle: store.name,
    headerRight: () => <Pressable onPress={() => setStoreId(undefined)} style={{ marginRight: 14 }}><Text style={{ color: '#94a3b8' }}>Switch</Text></Pressable> }}>
    <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: I('📥'), tabBarBadge: newCount || undefined }} />
    <Tabs.Screen name="catalogue" options={{ title: 'Items', tabBarIcon: I('🏷️') }} />
    <Tabs.Screen name="rx" options={{ title: 'Rx review', tabBarIcon: I('💊'), tabBarBadge: rxCount || undefined, href: store.cat === 'med' ? undefined : null }} />
    <Tabs.Screen name="sales" options={{ title: 'Sales', tabBarIcon: I('📈') }} />
  </Tabs>;
}
