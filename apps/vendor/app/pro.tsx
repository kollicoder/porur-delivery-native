/** Service-pro dashboard: today's jobs, OTP start, quote builder, OTP finish + collection, earnings. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Job, Pro, SERVICES, jobPayable, fmtDay, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Pill, Segmented, TAP } from '@porur/shared/src/ui/kit';
import { Title, Field, Kv, Chip } from '@porur/shared/src/ui/kit2';
import { api, useVendor } from '../src/store';
const LBL: Record<string, string> = { assigned: 'New', en_route: 'On the way', started: 'Inspecting', quoted: 'Waiting for customer', quote_approved: 'Approved — do the work', quote_declined: 'Declined — inspection only', done: 'Done', cancelled: 'Cancelled', requested: 'Requested' };

export default function ProHome() {
  const { me, ready } = useVendor(); const proId = me?.role === 'pro' ? me.proId : undefined; const [pro, setPro] = useState<Pro | null>(null); const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => { if (!proId) return; const m = api.models; const subs = [m.watchPros(p => setPro(p.find(x => x.id === proId) || null)), m.watchProJobs(proId, setJobs)]; return () => subs.forEach(f => f()); }, [proId]);
  if (ready && !proId) return <Redirect href="/" />;
  if (!jobs || !pro) return <SafeAreaView style={{ flex: 1, backgroundColor: K.bg, padding: 16 }}><SkeletonList n={4} testID="pro-loading" /></SafeAreaView>;
  const active = jobs.filter(j => !['done', 'cancelled'].includes(j.status)), done = jobs.filter(j => j.status === 'done');
  const earned = done.reduce((a, j) => a + jobPayable(j), 0);
  return <SafeAreaView style={{ flex: 1, backgroundColor: K.bg }} edges={['top']}><ScrollView testID="pro-home" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink }}>🛠️ {pro.name}</Text>
      <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{pro.skills.map(s => SERVICES.find(x => x.id === s)?.name).join(' · ')} · ★ {pro.rating || 'new'} ({pro.ratingCount}) · {pro.policeVerified ? 'police-verified ✓' : 'police check pending'}</Text></View>
      <Pressable testID="signout" onPress={() => api.logout()} style={{ minHeight: TAP, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ fontFamily: F.bold, textDecorationLine: 'underline', color: K.ink }}>Sign out</Text></Pressable></View>
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><Card style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, fontSize: 12, color: K.muted }}>Jobs done</Text><Text style={{ fontFamily: F.display, fontSize: 22, color: K.ink }}>{done.length}</Text></Card>
      <Card style={{ flex: 1 }} testID="pro-earned"><Text style={{ fontFamily: F.bold, fontSize: 12, color: K.muted }}>Billed (you keep 85%)</Text><Text style={{ fontFamily: F.display, fontSize: 22, color: K.green }}>{rs(earned * 0.85)}</Text></Card></View>
    {pro.status === 'paused' && <Banner tone="warn" title="Paused by Porur" body="You won't get new jobs until the team re-activates you." />}
    <Title en={`Upcoming (${active.length})`} ta="வரவிருக்கும் வேலைகள்" />
    {active.length === 0 ? <Empty testID="pro-empty" emoji="🧰" title="No jobs right now" body="New bookings in your skills appear here automatically." /> : active.map(j => <JobCard key={j.id} j={j} />)}
    {done.length > 0 && <><Title en="Completed" ta="முடிந்தவை" />{done.slice(0, 10).map(j => <Card key={j.id} style={{ marginBottom: 6 }}><Kv k={`${j.serviceName} · ${fmtDay(j.slotStartMs)}`} v={rs(jobPayable(j))} />{!!j.rating && <Text style={{ fontFamily: F.body, color: K.muted }}>{'★'.repeat(j.rating)} {j.review}</Text>}</Card>)}</>}
  </ScrollView></SafeAreaView>;
}
function JobCard({ j }: { j: Job }) {
  const [otp, setOtp] = useState(''); const [lines, setLines] = useState<{ label: string; amount: number }[]>([]); const [lab, setLab] = useState(''); const [amt, setAmt] = useState(''); const [via, setVia] = useState<'cash' | 'upi'>('upi');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const svc = SERVICES.find(x => x.id === j.serviceId);
  const run = (f: () => Promise<any>, bad = 'Wrong OTP — ask the customer to read it from their app.') => async () => { setErr(''); setBusy(true); try { await f(); setOtp(''); } catch (e: any) { setErr(/permission/i.test(e.message) ? bad : e.message); } finally { setBusy(false); } };
  return <Card testID={'pj-' + j.id} style={{ marginBottom: 10, borderWidth: 2, borderColor: K.ink }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{svc?.emoji} {j.serviceName}{j.warrantyOf ? ' · WARRANTY' : ''}</Text><Pill label={LBL[j.status]} bg={K.yellowSoft} /></View>
    <Text style={{ fontFamily: F.bold, color: K.ink2 }}>{fmtDay(j.slotStartMs)} · {j.slotLabel}</Text><Text style={{ fontFamily: F.body, color: K.ink2 }}>{j.customer} · {j.phone}</Text>
    <Text style={{ fontFamily: F.body, color: K.ink2 }}>📍 {j.address}</Text><Text style={{ fontFamily: F.body, color: K.muted, fontSize: 13 }}>“{j.problem}”</Text>
    {!!err && <Banner tone="error" title={err} testID="pj-error" />}
    {j.status === 'assigned' && <Button testID="pj-enroute" kind="dark" title="I'm on my way" disabled={busy} style={{ marginTop: 8 }} onPress={run(() => api.models.jobEnRoute(j.id), 'Could not update')} />}
    {['assigned', 'en_route'].includes(j.status) && <><Field label="Start OTP (from the customer)" value={otp} onChangeText={setOtp} testID="pj-start-otp" keyboardType="number-pad" maxLength={4} />
      <Button testID="pj-start" kind="primary" title="Start inspection" disabled={busy || otp.length !== 4} style={{ marginTop: 8 }} onPress={run(() => api.models.jobStart(j.id, otp))} /></>}
    {j.status === 'started' && <><Text style={{ fontFamily: F.bold, color: K.ink, marginTop: 8 }}>Quote (inspection {rs(j.inspectionFee)} already counted)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{svc?.rateCard.map(([l, a]) => <Chip key={l} testID={'rc-' + l.slice(0, 6)} label={`${l} ₹${a}`} onPress={() => setLines(x => [...x, { label: l, amount: a }])} />)}</View>
      <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 2 }}><Field label="Other item / part" value={lab} onChangeText={setLab} testID="pj-line" /></View><View style={{ flex: 1 }}><Field label="₹" value={amt} onChangeText={setAmt} keyboardType="number-pad" testID="pj-amt" maxLength={5} /></View></View>
      <Button kind="ghost" title="+ Add line" disabled={!lab.trim() || !(Number(amt) > 0)} style={{ marginTop: 6 }} onPress={() => { setLines(x => [...x, { label: lab.trim(), amount: Number(amt) }]); setLab(''); setAmt(''); }} />
      {lines.map((l, i) => <Kv key={i} k={l.label} v={rs(l.amount)} />)}
      <Button testID="pj-quote" kind="primary" title={`Send quote · ${rs(lines.reduce((a, l) => a + l.amount, 0))}`} disabled={busy || !lines.length || lines.length > 10} style={{ marginTop: 8 }} onPress={run(() => api.models.jobQuote(j.id, lines), 'Could not send quote')} />
      <Button testID="pj-noquote" kind="ghost" title="No work needed — finish with inspection only" style={{ marginTop: 6 }} disabled={busy} onPress={run(() => api.models.jobQuote(j.id, []), 'Could not update')} /></>}
    {j.status === 'quoted' && <Text style={{ fontFamily: F.body, color: K.muted, marginTop: 6 }}>Waiting for the customer to approve {rs(j.quoteTotal || 0)} in their app…</Text>}
    {['started', 'quote_approved', 'quote_declined'].includes(j.status) && j.status !== 'started' && <><Kv bold k="Collect" v={rs(jobPayable(j))} testID="pj-collect" />
      <Segmented value={via} onChange={setVia} options={[['upi', '📱 UPI'], ['cash', '💵 Cash']] as const} />
      <Field label="Finish OTP (from the customer)" value={otp} onChangeText={setOtp} testID="pj-finish-otp" keyboardType="number-pad" maxLength={4} />
      <Button testID="pj-finish" kind="green" title="Finish job & collected" disabled={busy || otp.length !== 4} style={{ marginTop: 8 }} onPress={run(() => api.models.jobFinish(j.id, otp, via))} /></>}
  </Card>;
}
