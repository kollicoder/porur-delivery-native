import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { CATEGORIES, BRAND, ONBOARD_ITEMS, SERVICES, KYC_FIELDS } from '@porur/shared';
import { K, F, Button, Skeleton, Segmented, Banner } from '@porur/shared/src/ui/kit';
import { Chip } from '@porur/shared/src/ui/kit2';
import { PhoneLogin } from '@porur/shared/src/ui/Login';
import { s } from '../src/theme';
import { useVendor, api, ALL_STORES } from '../src/store';
type Kind = 'vendor' | 'cook' | 'pro';
export default function Login() {
  const { store, ready, user, me } = useVendor(); const [kind, setKind] = useState<Kind>('vendor');
  useEffect(() => { if (!ready) return; if (store) router.replace('/orders'); else if (me?.role === 'cook' && me.cookId) router.replace('/cook'); else if (me?.role === 'pro' && me.proId) router.replace('/pro'); }, [ready, store, me?.role, me?.cookId, me?.proId]);
  const [app, setApp] = useState<any>(undefined);
  useEffect(() => { if (!user) return; const k = me?.request?.role; if (k === 'cook' || k === 'pro') return api.models.watchApplication(k, setApp); setApp(null); }, [user, me?.request?.role]);
  if (!ready) return <View testID="boot-skeleton" style={{ flex: 1, backgroundColor: K.ink, padding: 22, paddingTop: 70, gap: 14 }}><Skeleton h={34} w="60%" /><Skeleton h={200} r={24} /></View>;
  if (!user) return <PhoneLogin api={api} dark brand={BRAND.partner} title="For stores, kitchens, home cooks & service pros" subtitle="Sign in with your registered mobile number." testHint="Demo: use a partner test number from the release notes." />;
  const req = me?.request; const reqName = req?.role === 'vendor' ? ALL_STORES.find(x => x.id === req.storeId)?.name || req.storeId : req?.role === 'cook' ? 'a home-cook kitchen' : 'home services';
  return <ScrollView style={{ flex: 1, backgroundColor: K.ink }} contentContainerStyle={{ padding: 22, paddingTop: 60 }}>
    <Text style={{ color: '#fff', fontSize: 30, fontFamily: F.display }}>Partner access</Text>
    <Text style={{ color: '#E9E4D8', marginTop: 6, fontFamily: F.body }}>Signed in as {user.phoneNumber}</Text>
    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 18, marginTop: 22 }}>
      {req && app?.status !== 'rejected' ? <View testID="pending">
        <Text style={{ fontSize: 20, fontFamily: F.display, color: K.ink }}>⏳ Waiting for approval</Text>
        <Text style={[s.muted, { marginTop: 6 }]}>You asked to join as {req.role === 'vendor' ? 'the partner for ' : ''}{reqName}. The {BRAND.name} team checks {req.role === 'cook' ? 'your FSSAI registration and books a kitchen visit' : req.role === 'pro' ? 'your ID and police verification' : 'your store details'} — this screen updates automatically.</Text>
        {app?.police && <Text style={[s.muted, { marginTop: 6 }]}>Police verification: {app.police}</Text>}
      </View> : <>
        {app?.status === 'rejected' && <Banner tone="error" title="Application not approved" body={app.reason || 'Please correct the details and apply again.'} testID="rejected" />}
        <Text style={{ fontSize: 20, fontFamily: F.display, color: K.ink }}>I am a…</Text>
        <View style={{ marginTop: 8 }}><Segmented value={kind} onChange={setKind} options={[['vendor', '🏪 Store'], ['cook', '👩‍🍳 Home cook'], ['pro', '🛠️ Service pro']] as const} /></View>
        {kind === 'vendor' ? <VendorReq /> : kind === 'cook' ? <CookReq /> : <ProReq />}
      </>}
      <Pressable testID="logout" onPress={() => api.logout()} style={{ marginTop: 8, minHeight: 48, justifyContent: 'center' }}><Text style={{ color: K.ink, textAlign: 'center', fontFamily: F.bold, textDecorationLine: 'underline' }}>Sign out</Text></Pressable>
    </View></ScrollView>;
}
function VendorReq() {
  const [sel, setSel] = useState('s1'); const [name, setName] = useState(''); const [err, setErr] = useState('');
  return <><Text style={s.label}>Your name</Text><TextInput testID="req-name" style={s.input} value={name} onChangeText={setName} placeholder="e.g. Ramesh" />
    <Text style={s.label}>Your store / kitchen</Text>
    {ALL_STORES.map(st => <Pressable key={st.id} testID={'store-' + st.id} onPress={() => setSel(st.id)} style={[s.card, { borderWidth: 2, borderColor: sel === st.id ? K.ink : K.line, backgroundColor: sel === st.id ? K.greenSoft : '#fff', minHeight: 64, flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
      <Text style={{ fontSize: 26 }}>{CATEGORIES.find(c => c.id === st.cat)?.emoji || '🍛'}</Text>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{st.name}</Text><Text style={s.muted}>{st.type} · {st.commission}% commission</Text></View></Pressable>)}
    {!!err && <Text style={{ color: K.red }}>{err}</Text>}
    <Button testID="request-vendor" title="Request access" style={{ marginTop: 12 }} onPress={() => api.updateMe({ name: name || undefined, request: { role: 'vendor', storeId: sel, at: Date.now() } as any }).catch(e => setErr(e.message))} /></>;
}
function CookReq() {
  const [f, setF] = useState({ name: '', kitchen: '', area: 'Porur', fssaiNo: '', fssaiExpiry: '', capacity: '20' }); const [veg, setVeg] = useState(true); const [nonVeg, setNonVeg] = useState(false);
  const [chk, setChk] = useState<Record<string, boolean>>({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const up = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v })); const allChk = ONBOARD_ITEMS.every(([k]) => chk[k]);
  const fssaiOk = /^[0-9]{14}$/.test(f.fssaiNo.trim());
  const go = async () => { setErr(''); if (!f.name.trim() || !f.kitchen.trim()) return setErr('Add your name and kitchen name.'); if (!fssaiOk) return setErr('FSSAI registration number is 14 digits.'); if (!allChk) return setErr('Tick every onboarding item.');
    setBusy(true); try { await api.models.apply('cook', { ...f, name: f.name.trim(), kitchen: f.kitchen.trim(), fssaiNo: f.fssaiNo.trim(), capacity: Number(f.capacity) || 20, veg, nonVeg, checklist: chk }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };
  return <View testID="cook-form"><Text style={[s.muted, { marginTop: 10 }]}>Cook office lunches (₹130–150 a pack) from your home kitchen. You need a basic FSSAI registration (₹100/yr) — we can help you apply.</Text>
    <Text style={s.label}>Your name</Text><TextInput testID="cook-name" style={s.input} value={f.name} onChangeText={up('name')} />
    <Text style={s.label}>Kitchen name</Text><TextInput testID="cook-kitchen" style={s.input} value={f.kitchen} onChangeText={up('kitchen')} placeholder="e.g. Amma's Kitchen" />
    <Text style={s.label}>Area</Text><TextInput testID="cook-area" style={s.input} value={f.area} onChangeText={up('area')} />
    <Text style={s.label}>FSSAI registration no. (14 digits)</Text><TextInput testID="cook-fssai" style={s.input} value={f.fssaiNo} onChangeText={up('fssaiNo')} keyboardType="number-pad" maxLength={14} />
    <Text style={s.label}>FSSAI valid until</Text><TextInput testID="cook-fssai-exp" style={s.input} value={f.fssaiExpiry} onChangeText={up('fssaiExpiry')} placeholder="YYYY-MM-DD" maxLength={10} />
    <Text style={s.label}>Packs you can cook per day</Text><TextInput testID="cook-capacity" style={s.input} value={f.capacity} onChangeText={up('capacity')} keyboardType="number-pad" maxLength={3} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}><Chip label="🟢 Veg" on={veg} onPress={() => setVeg(!veg)} /><Chip testID="cook-nonveg" label="🔴 Non-veg" on={nonVeg} onPress={() => setNonVeg(!nonVeg)} /></View>
    <Text style={s.label}>Hygiene & onboarding</Text>
    {ONBOARD_ITEMS.map(([k, l]) => <Pressable key={k} testID={'onb-' + k} accessibilityRole="checkbox" accessibilityState={{ checked: !!chk[k] }} onPress={() => setChk(c => ({ ...c, [k]: !c[k] }))} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 48 }}>
      <Text style={{ fontSize: 22, color: chk[k] ? K.green : K.muted }}>{chk[k] ? '☑' : '☐'}</Text><Text style={{ fontFamily: F.body, color: K.ink, flex: 1 }}>{l}</Text></Pressable>)}
    {!!err && <Banner tone="error" title={err} testID="cook-error" />}
    <Button testID="cook-apply" title={busy ? 'Sending…' : 'Apply as a home cook'} disabled={busy} style={{ marginTop: 12 }} onPress={go} /></View>;
}
function ProReq() {
  const [name, setName] = useState(''); const [area, setArea] = useState('Porur'); const [skills, setSkills] = useState<string[]>([]); const [kyc, setKyc] = useState<Record<string, string>>({ idType: 'Aadhaar' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => { setErr(''); if (!name.trim()) return setErr('Add your name.'); if (!skills.length) return setErr('Pick at least one skill.'); if (!/^[0-9]{4}$/.test(kyc.idLast4 || '')) return setErr('Enter only the LAST 4 digits of your ID.');
    setBusy(true); try { await api.models.apply('pro', { name: name.trim(), area, skills, ...kyc, police: kyc.policeRef ? 'submitted' : 'pending' }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } };
  return <View testID="pro-form"><Text style={[s.muted, { marginTop: 10 }]}>Get plumbing, electrical, appliance and deep-cleaning jobs near Porur. ₹149 inspection + your quote; 85% to you. Police verification required.</Text>
    <Text style={s.label}>Your name</Text><TextInput testID="pro-name" style={s.input} value={name} onChangeText={setName} />
    <Text style={s.label}>Area</Text><TextInput style={s.input} value={area} onChangeText={setArea} />
    <Text style={s.label}>Skills</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{SERVICES.map(x => <Chip key={x.id} testID={'skill-' + x.id} label={`${x.emoji} ${x.name}`} on={skills.includes(x.id)} onPress={() => setSkills(sk => sk.includes(x.id) ? sk.filter(y => y !== x.id) : [...sk, x.id])} />)}</View>
    <Text style={[s.muted, { marginTop: 6 }]}>KYC — we never store your full Aadhaar number.</Text>
    {KYC_FIELDS.map(([k, l]) => <View key={k}><Text style={s.label}>{l}</Text><TextInput testID={'kyc-' + k} style={s.input} value={kyc[k] || ''} onChangeText={v => setKyc(x => ({ ...x, [k]: v }))} keyboardType={k === 'idLast4' ? 'number-pad' : 'default'} maxLength={k === 'idLast4' ? 4 : 40} /></View>)}
    {!!err && <Banner tone="error" title={err} testID="pro-error" />}
    <Button testID="pro-apply" title={busy ? 'Sending…' : 'Apply as a service pro'} disabled={busy} style={{ marginTop: 12 }} onPress={go} /></View>;
}
