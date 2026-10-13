import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { STORES, CATEGORIES } from '@porur/shared';
import { PhoneLogin } from '@porur/shared/src/ui/Login';
import { s, C } from '../src/theme';
import { useVendor, api } from '../src/store';
export default function Login() {
  const { store, ready, user, me } = useVendor(); const [sel, setSel] = useState('s1'); const [name, setName] = useState(''); const [err, setErr] = useState('');
  useEffect(() => { if (ready && store) router.replace('/orders'); }, [ready, store]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#0f172a' }} />;
  if (!user) return <PhoneLogin api={api} dark color="#16a34a" title={'Porur Delivery\nPartner'} subtitle="For our tie-up stores — sign in with your registered mobile number." testHint="Demo: use a vendor test number from the release notes." />;
  const req = me?.request;
  return <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={{ padding: 22, paddingTop: 70 }}>
    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>Partner access</Text>
    <Text style={{ color: '#94a3b8', marginTop: 6 }}>Signed in as {user.phoneNumber}</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 24 }}>
      {req ? <View testID="pending">
        <Text style={{ fontSize: 18, fontWeight: '800' }}>⏳ Waiting for approval</Text>
        <Text style={[s.muted, { marginTop: 6 }]}>You asked to manage {STORES.find(x => x.id === req.storeId)?.name || req.storeId}. The Porur Delivery admin will approve it shortly — this screen updates automatically.</Text>
      </View> : <>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>Request access to your store</Text>
        <Text style={s.label}>Your name</Text><TextInput testID="req-name" style={s.input} value={name} onChangeText={setName} placeholder="e.g. Ramesh" />
        <Text style={s.label}>Your store</Text>
        {STORES.map(st => <Pressable key={st.id} testID={'store-' + st.id} onPress={() => setSel(st.id)} style={[s.card, { borderWidth: 2, borderColor: sel === st.id ? C.green : 'transparent', flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
          <Text style={{ fontSize: 26 }}>{CATEGORIES.find(c => c.id === st.cat)!.emoji}</Text>
          <View><Text style={{ fontWeight: '800' }}>{st.name}</Text><Text style={s.muted}>{st.type} · {st.commission}% commission</Text></View></Pressable>)}
        {!!err && <Text style={{ color: '#dc2626' }}>{err}</Text>}
        <Pressable testID="request-vendor" style={s.btn} onPress={() => api.updateMe({ name: name || undefined, request: { role: 'vendor', storeId: sel, at: Date.now() } as any }).catch(e => setErr(e.message))}><Text style={s.btnTxt}>Request access</Text></Pressable>
      </>}
      <Pressable testID="logout" onPress={() => api.logout()} style={{ marginTop: 14 }}><Text style={{ color: '#64748b', textAlign: 'center' }}>Sign out</Text></Pressable>
    </View></ScrollView>;
}
