import React from 'react';
import { Stack } from 'expo-router';
import { useFonts, NotoSansTamil_400Regular } from '@expo-google-fonts/noto-sans-tamil';
import { StatusBar } from 'expo-status-bar';
import { VendorProvider } from '../src/store';
export default function Root() {
  const [loaded] = useFonts({ NotoSansTamil_400Regular }); if (!loaded) return null;
  return <VendorProvider><StatusBar style="light" /><Stack screenOptions={{ headerShown: false }} /></VendorProvider>;
}
