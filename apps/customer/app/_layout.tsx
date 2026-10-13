import React from 'react';
import { Stack } from 'expo-router';
import { useFonts, NotoSansTamil_400Regular, NotoSansTamil_700Bold } from '@expo-google-fonts/noto-sans-tamil';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/store';
import { C } from '../src/theme';

export default function Root() {
  const [loaded] = useFonts({ NotoSansTamil_400Regular, NotoSansTamil_700Bold });
  if (!loaded) return null;
  return <AppProvider><StatusBar style="dark" />
    <Stack screenOptions={{ headerTintColor: C.dark, headerStyle: { backgroundColor: '#fff' }, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Shop' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Track order' }} />
      <Stack.Screen name="rider" options={{ title: 'Book a Rider 🛵' }} />
    </Stack></AppProvider>;
}
