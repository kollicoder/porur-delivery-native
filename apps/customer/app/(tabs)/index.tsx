import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, STORES, BRAND } from '@porur/shared';
import { K, F, TAP } from '@porur/shared/src/ui/kit';
import { CartBar, tileColor } from '../../src/ui';
import { useApp } from '../../src/store';

export default function Home() {
  const { t, settings } = useApp();
  return <SafeAreaView style={{ flex: 1, backgroundColor: K.bg }} edges={['top']}><ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 170 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{t('Delivering to', 'டெலிவரி முகவரி')}</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 15, color: K.ink }}>📍 {BRAND.area}</Text></View>
      <Pressable testID="open-settings" accessibilityLabel="Profile and settings" onPress={() => router.push('/settings')} style={{ width: TAP, height: TAP, borderRadius: 24, backgroundColor: K.card, borderWidth: 1, borderColor: K.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>👤</Text></Pressable>
    </View>
    <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 33, color: K.ink, marginTop: 14, letterSpacing: -0.6 }}>Groceries, veggies & medicines in <Text style={{ color: K.green }}>30 minutes.</Text></Text>
    <Text style={{ fontFamily: F.ta, fontSize: 13, color: K.muted, marginTop: 4 }}>30 நிமிடத்தில் வீட்டுக்கே டெலிவரி</Text>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      <Pressable testID="home-search" onPress={() => router.push('/search')} style={{ flex: 1, minHeight: 52, borderRadius: 999, backgroundColor: K.card, borderWidth: 1, borderColor: K.line, justifyContent: 'center', paddingHorizontal: 16 }}>
        <Text numberOfLines={1} style={{ fontFamily: F.body, color: K.muted }}>🔍 {t('Search tomato, milk, paracetamol…', 'தக்காளி, பால் தேடுங்கள்…')}</Text></Pressable>
      <Pressable testID="voice-cta" accessibilityLabel="Order by voice" onPress={() => router.push('/voice')} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: K.orangeBright, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>🎤</Text></Pressable>
    </View>
    <Text style={{ fontFamily: F.display, fontSize: 20, color: K.ink, marginTop: 18, marginBottom: 10 }}>{t('What do you need?', 'உங்களுக்கு என்ன வேண்டும்?')}</Text>
    {/* 2×2 compact tiles: all four categories above the fold on a 360×640 phone; nothing clipped */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
      {CATEGORIES.map(c => <Pressable key={c.id} testID={'cat-' + c.id} accessibilityLabel={c.label} onPress={() => router.push(c.id === 'rider' ? '/rider' : `/category/${c.id}`)}
        style={{ width: '48.5%', height: 118, backgroundColor: tileColor(c.id), borderRadius: 22, padding: 12, overflow: 'hidden' }}>
        <Text style={{ fontFamily: F.bold, fontSize: 11, color: K.ink2 }}>{c.id === 'rider' ? 'Anything, anywhere' : c.id === 'med' ? '24×7' : '20–30 min'}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 19, color: K.ink, marginTop: 2 }}>{c.label}</Text>
        <Text style={{ fontFamily: F.ta, fontSize: 12, color: K.ink2 }}>{c.ta}</Text>
        <Text style={{ position: 'absolute', right: 10, bottom: 4, fontSize: 40 }}>{c.emoji}</Text>
      </Pressable>)}
    </View>
    <Pressable testID="voice-banner" onPress={() => router.push('/voice')} style={{ marginTop: 12, backgroundColor: K.orangeBright, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 19, color: K.ink }}>{t('Just say your list', 'உங்கள் பட்டியலைச் சொல்லுங்கள்')}</Text>
        <Text style={{ fontFamily: F.ta, color: K.ink, fontSize: 13, marginTop: 2 }}>தமிழ் or English · "2 kg tomato, 1 litre milk"</Text></View>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: K.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>🎤</Text></View>
    </Pressable>
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
      <View style={{ flex: 1, backgroundColor: K.green, borderRadius: 22, padding: 14 }}><Text style={{ fontFamily: F.display, color: '#fff', fontSize: 16 }}>Free delivery above ₹{settings.free}</Text><Text style={{ fontFamily: F.body, color: '#fff', fontSize: 12, marginTop: 4 }}>Applied at checkout</Text></View>
      <View style={{ flex: 1, backgroundColor: K.lilac, borderRadius: 22, padding: 14 }}><Text style={{ fontFamily: F.display, color: K.ink, fontSize: 16 }}>Medicines all night</Text><Text style={{ fontFamily: F.body, color: K.ink2, fontSize: 12, marginTop: 4 }}>24×7 pharmacy tie-up</Text></View>
    </View>
    <Text style={{ fontFamily: F.display, fontSize: 20, color: K.ink, marginTop: 18, marginBottom: 6 }}>{t('Stores near you', 'அருகிலுள்ள கடைகள்')}</Text>
    {STORES.map(st => <Pressable key={st.id} onPress={() => router.push(`/category/${st.cat}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: K.card, borderRadius: 20, padding: 12, marginVertical: 5, borderWidth: 1, borderColor: K.line, minHeight: 64 }}>
      <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: tileColor(st.cat), alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24 }}>{CATEGORIES.find(c => c.id === st.cat)!.emoji}</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{st.name}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>★ {st.rating} · {st.eta} · {st.open}</Text></View>
      <View style={{ backgroundColor: K.greenSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontFamily: F.bold, fontSize: 12, color: '#14532D' }}>Open</Text></View>
    </Pressable>)}
  </ScrollView><CartBar /></SafeAreaView>;
}
