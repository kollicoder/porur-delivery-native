import React from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { VendorProvider } from '../src/store';
import { APP_FONTS } from '@porur/shared/src/ui/fonts';
import { K, OfflineBanner } from '@porur/shared/src/ui/kit';
export default function Root() {
  const [loaded] = useFonts(APP_FONTS); if (!loaded) return <View style={{ flex: 1, backgroundColor: K.ink }} />;
  return <VendorProvider><StatusBar style="dark" /><OfflineBanner /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: K.bg } }} /></VendorProvider>;
}
