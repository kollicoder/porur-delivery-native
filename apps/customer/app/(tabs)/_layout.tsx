import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../src/theme';
import { useApp } from '../../src/store';
const I = (e: string) => () => <Text style={{ fontSize: 20 }}>{e}</Text>;
export default function TabsLayout() {
  const { cart } = useApp(); const n = Object.keys(cart).length;
  return <Tabs screenOptions={{ tabBarActiveTintColor: C.green, headerTitleStyle: { fontWeight: '800' } }}>
    <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: I('🏠') }} />
    <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: I('🔍') }} />
    <Tabs.Screen name="voice" options={{ title: 'Voice order', tabBarLabel: 'Speak', tabBarIcon: I('🎤') }} />
    <Tabs.Screen name="cart" options={{ title: 'Your cart', tabBarIcon: I('🛒'), tabBarBadge: n || undefined }} />
    <Tabs.Screen name="orders" options={{ title: 'My orders', tabBarIcon: I('📦') }} />
  </Tabs>;
}
