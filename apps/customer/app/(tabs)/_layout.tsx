import React from 'react';
import { Tabs } from 'expo-router';
import { PillTabBar, K, F } from '@porur/shared/src/ui/kit';
import { useApp } from '../../src/store';
export default function TabsLayout() {
  const { cart, t } = useApp(); const n = Object.keys(cart).length;
  return <Tabs tabBar={p => <PillTabBar {...p} />} screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: K.bg }, headerTitleStyle: { fontFamily: F.display, fontSize: 24 } as any, sceneStyle: { backgroundColor: K.bg } } as any}>
    <Tabs.Screen name="index" options={{ title: t('Home', 'முகப்பு'), headerShown: false, icon: '🏠' } as any} />
    <Tabs.Screen name="search" options={{ title: t('Search', 'தேடல்'), icon: '🔍' } as any} />
    <Tabs.Screen name="voice" options={{ title: t('Say your list', 'சொல்லுங்கள்'), tabBarLabel: t('Speak', 'பேசு'), icon: '🎤', center: true } as any} />
    <Tabs.Screen name="cart" options={{ title: t('Cart', 'கூடை'), icon: '🛒', tabBarBadge: n || undefined } as any} />
    <Tabs.Screen name="orders" options={{ title: t('Orders', 'ஆர்டர்கள்'), icon: '📦' } as any} />
  </Tabs>;
}
