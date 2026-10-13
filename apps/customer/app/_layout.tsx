import React from 'react';
import { Stack } from 'expo-router';
import { useFonts, NotoSansTamil_400Regular, NotoSansTamil_700Bold } from '@expo-google-fonts/noto-sans-tamil';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp, api } from '../src/store';
import { PhoneLogin } from '@porur/shared/src/ui/Login';
import { View, Text } from 'react-native';
import { C } from '../src/theme';

export default function Root() {
  const [loaded] = useFonts({ NotoSansTamil_400Regular, NotoSansTamil_700Bold });
  if (!loaded) return null;
  return <AppProvider><StatusBar style="dark" /><Gate>
    <Stack screenOptions={{ headerTintColor: C.dark, headerStyle: { backgroundColor: '#fff' }, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Shop' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Track order' }} />
      <Stack.Screen name="rider" options={{ title: 'Book a Rider 🛵' }} />
    </Stack></Gate></AppProvider>;
}
function Gate({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (user === undefined) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Loading…</Text></View>;
  if (!user) return <PhoneLogin api={api} title="Porur Delivery" subtitle="Groceries, fruits & veg and medicines in ~30 min. Sign in with your mobile number." testHint="Demo: use a Firebase test number from the release notes." />;
  return <>{children}</>;
}
