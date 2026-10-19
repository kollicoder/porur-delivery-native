import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { BRAND } from '@porur/shared';
import { K, F, Card, Segmented, Button, TAP } from '@porur/shared/src/ui/kit';
import { s } from '../src/theme';
import { useApp, api } from '../src/store';
export default function Settings() {
  const { user, me, lang, setLang, t } = useApp();
  const Row = ({ icon, label, onPress, testID }: { icon: string; label: string; onPress: () => void; testID?: string }) =>
    <Pressable testID={testID} onPress={onPress} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: K.line }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text><Text style={{ flex: 1, fontFamily: F.bold, color: K.ink }}>{label}</Text><Text style={{ color: K.muted, fontSize: 18 }}>›</Text></Pressable>;
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: K.yellow, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.display, fontSize: 22, color: K.ink }}>{(me?.name || 'Y')[0].toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 19, color: K.ink }}>{me?.name || t('Your profile', 'உங்கள் சுயவிவரம்')}</Text><Text testID="profile-phone" style={s.muted}>{user?.phoneNumber}</Text></View></Card>
    <Text style={s.label}>{t('Language', 'மொழி')}</Text>
    <Segmented value={lang} onChange={setLang} options={[['en', 'English'], ['ta', 'தமிழ்']] as const} />
    <Text style={[s.muted, { marginTop: 6 }]}>{t('Changes menus and the default voice language.', 'மெனுக்கள் மற்றும் குரல் மொழியை மாற்றும்.')}</Text>
    <Card style={{ marginTop: 14, paddingVertical: 0 }}>
      <Row testID="set-orders" icon="📦" label={t('My orders', 'எனது ஆர்டர்கள்')} onPress={() => router.push('/orders')} />
      <Row icon="🏠" label={t('Saved address', 'சேமித்த முகவரி')} onPress={() => router.push('/checkout')} />
      <Row icon="🛵" label={t('Book a rider', 'ரைடர் புக்')} onPress={() => router.push('/rider')} />
      <Row testID="set-credits" icon="ℹ️" label={t('About & photo credits', 'பற்றி')} onPress={() => router.push('/credits')} />
    </Card>
    <Button testID="logout" kind="ghost" title={t('Sign out', 'வெளியேறு')} onPress={() => api.logout()} style={{ marginTop: 16 }} />
    <Text style={[s.muted, { textAlign: 'center', marginTop: 12 }]}>{BRAND.name} · v0.6</Text>
  </ScrollView>;
}
