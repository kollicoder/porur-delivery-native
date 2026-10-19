import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, Pressable, View } from 'react-native';
import { PillTabBar, K, F, TAP } from '@porur/shared/src/ui/kit';
import { useVendor } from '../../src/store';
export default function L() {
  const { store, ready, setStoreId, orders, storeDoc } = useVendor(); if (!ready) return null; if (!store) return <Redirect href="/" />;
  const newCount = orders.filter(o => o.status === 'placed').length; const rxCount = orders.filter(o => o.rxStatus === 'pending').length;
  return <Tabs tabBar={p => <PillTabBar {...p} />} screenOptions={{ headerStyle: { backgroundColor: K.card }, headerShadowVisible: false, headerTintColor: K.ink, headerTitle: store.name,
    headerTitleStyle: { fontFamily: F.display, fontSize: 18 } as any, sceneStyle: { backgroundColor: K.bg },
    headerRight: () => <Pressable testID="signout" onPress={() => setStoreId(undefined)} style={{ marginRight: 8, minHeight: TAP, paddingHorizontal: 10, justifyContent: 'center' }}><Text style={{ color: K.ink, fontFamily: F.bold, textDecorationLine: 'underline' }}>Sign out</Text></Pressable> } as any}>
    <Tabs.Screen name="orders" options={{ title: 'Orders', icon: '📥', tabBarBadge: newCount || undefined } as any} />
    <Tabs.Screen name="catalogue" options={{ title: 'Items', icon: '🏷️' } as any} />
    <Tabs.Screen name="rx" options={{ title: 'Rx review', icon: '💊', tabBarBadge: rxCount || undefined, href: store.cat === 'med' ? undefined : null } as any} />
 <Tabs.Screen name="deals" options={{ title: 'Deals', icon: '🔥', href: storeDoc?.dealsApproved || store.cat === ('food' as any) ? undefined : null } as any} />
    <Tabs.Screen name="sales" options={{ title: 'Sales', icon: '📈' } as any} />
  </Tabs>;
}
