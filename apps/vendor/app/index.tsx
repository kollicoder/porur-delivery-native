import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { STORES, CATEGORIES, BRAND } from '@porur/shared';
import { K, F, Button, Skeleton } from '@porur/shared/src/ui/kit';
import { PhoneLogin } from '@porur/shared/src/ui/Login';
import { s, C } from '../src/theme';
import { useVendor, api } from '../src/store';
export default function Login() {
  const { store, ready, user, me } = useVendor(); const [sel, setSel] = useState('s1'); const [name, setName] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (ready && store) router.replace('/orders'); }, [ready, store]);
  if (!ready) return <View testID="boot-skeleton" style={{ flex: 1, backgroundColor: K.ink, padding: 22, paddingTop: 70, gap: 14 }}><Skeleton h={34} w="60%" /><Skeleton h={200} r={24} /></View>;
  if (!user) return <PhoneLogin api={api} dark brand={BRAND.partner} title="For tie-up stores and pharmacies" subtitle="Sign in with your registered mobile number." testHint="Demo: use a vendor test number from the release notes." />;
  const req = me?.request;
  return <ScrollView style={{ flex: 1, backgroundColor: K.ink }} contentContainerStyle={{ padding: 22, paddingTop: 60 }}>
    <Text style={{ color: '#fff', fontSize: 30, fontFamily: F.display }}>Partner access</Text>
    <Text style={{ color: '#E9E4D8', marginTop: 6, fontFamily: F.body }}>Signed in as {user.phoneNumber}</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 22 }}>
      {req ? <View testID="pending">
        <Text style={{ fontSize: 20, fontFamily: F.display, color: K.ink }}>⏳ Waiting for approval</Text>
        <Text style={[s.muted, { marginTop: 6 }]}>You asked to manage {STORES.find(x => x.id === req.storeId)?.name || req.storeId}. The {BRAND.name} admin will approve it shortly — this screen updates automatically.</Text>
      </View> : <>
        <Text style={{ fontSize: 20, fontFamily: F.display, color: K.ink }}>Request access to your store</Text>
        <Text style={s.label}>Your name</Text><TextInput testID="req-name" style={s.input} value={name} onChangeText={setName} placeholder="e.g. Ramesh" />
        <Text style={s.label}>Your store</Text>
        {STORES.map(st => <Pressable key={st.id} testID={'store-' + st.id} onPress={() => setSel(st.id)} style={[s.card, { borderWidth: 2, borderColor: sel === st.id ? K.ink : K.line, backgroundColor: sel === st.id ? K.greenSoft : '#fff', minHeight: 64, flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
          <Text style={{ fontSize: 26 }}>{CATEGORIES.find(c => c.id === st.cat)!.emoji}</Text>
          <View><Text style={{ fontFamily: F.bold, color: K.ink }}>{st.name}</Text><Text style={s.muted}>{st.type} · {st.commission}% commission</Text></View></Pressable>)}
        {!!err && <Text style={{ color: '#dc2626' }}>{err}</Text>}
        <Button testID="request-vendor" title="Request access" style={{ marginTop: 12 }} onPress={() => api.updateMe({ name: name || undefined, request: { role: 'vendor', storeId: sel, at: Date.now() } as any }).catch(e => setErr(e.message))} />
      </>}
      <Pressable testID="logout" onPress={() => api.logout()} style={{ marginTop: 8, minHeight: 48, justifyContent: 'center' }}><Text style={{ color: K.ink, textAlign: 'center', fontFamily: F.bold, textDecorationLine: 'underline' }}>Sign out</Text></Pressable>
    </View></ScrollView>;
}
