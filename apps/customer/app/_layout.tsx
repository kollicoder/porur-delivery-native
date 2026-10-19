import React from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AppProvider, useApp, api } from '../src/store';
import { PhoneLogin } from '@porur/shared/src/ui/Login';
import { APP_FONTS } from '@porur/shared/src/ui/fonts';
import { K, F, OfflineBanner, Skeleton } from '@porur/shared/src/ui/kit';
import { BRAND } from '@porur/shared';

export default function Root() {
  const [loaded] = useFonts(APP_FONTS);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: K.bg }} />;
  return <AppProvider><StatusBar style="dark" /><OfflineBanner /><Gate>
    <Stack screenOptions={{ headerTintColor: K.ink, headerShadowVisible: false, headerStyle: { backgroundColor: K.bg }, headerTitleStyle: { fontFamily: F.display, fontSize: 20 } as any, contentStyle: { backgroundColor: K.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Shop' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Track order' }} />
      <Stack.Screen name="rider" options={{ title: 'Book a rider' }} />
      <Stack.Screen name="settings" options={{ title: 'Profile & settings' }} />
      <Stack.Screen name="credits" options={{ title: 'About & credits' }} />
      <Stack.Screen name="meter" options={{ title: 'Group buy' }} />
      <Stack.Screen name="leader" options={{ title: 'Leader dashboard' }} />
      <Stack.Screen name="lunch" options={{ title: 'Office lunch' }} />
      <Stack.Screen name="services" options={{ title: 'Home services' }} />
      <Stack.Screen name="job/[id]" options={{ title: 'Your booking' }} />
      <Stack.Screen name="deals" options={{ title: "Tonight's deals" }} />
    </Stack></Gate></AppProvider>;
}
function Gate({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (user === undefined) return <View testID="boot-skeleton" style={{ flex: 1, backgroundColor: K.bg, padding: 20, paddingTop: 70, gap: 14 }}><Skeleton h={34} w="60%" /><Skeleton h={18} w="80%" /><Skeleton h={160} r={22} /><Skeleton h={160} r={22} /></View>;
  if (!user) return <PhoneLogin api={api} brand={BRAND.name} title={'Groceries, fruits & veg\nand medicines in about\n30 minutes.'} subtitle="Sign in with your mobile number." taLine="30 நிமிடத்தில் வீட்டுக்கே டெலிவரி" testHint="Demo: use a Firebase test number from the release notes." />;
  return <>{children}</>;
}
