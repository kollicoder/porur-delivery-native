/** Track a home-service job: OTPs, quote approval, payment, rating, 30-day warranty claim. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Job, Pro, JOB_STEPS, jobPayable, inWarranty, fmtDay, rs, SLOTS, istDate, DAY } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList } from '@porur/shared/src/ui/kit';
import { Title, Kv, CodeBox, Stars, Field, Chip } from '@porur/shared/src/ui/kit2';
import { api } from '../../src/store';
import { JOB_LABEL } from '../services';

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const [jobs, setJobs] = useState<Job[] | null>(null); const [sec, setSec] = useState<{ startOtp: string; finishOtp: string } | null>(null); const [pros, setPros] = useState<Pro[]>([]);
  const [stars, setStars] = useState(0); const [review, setReview] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [wslot, setWslot] = useState('');
  useEffect(() => { const m = api.models; const subs = [m.watchMyJobs(setJobs), m.watchJobSecret(id!, setSec), m.watchPros(setPros)]; return () => subs.forEach(f => f()); }, [id]);
  if (!jobs) return <ScrollView contentContainerStyle={{ padding: 16 }}><SkeletonList n={4} testID="job-loading" /></ScrollView>;
  const j = jobs.find(x => x.id === id); if (!j) return <Empty emoji="🔎" title="Booking not found" action="Back" onAction={() => router.back()} />;
  const run = (f: () => Promise<any>) => async () => { setErr(''); setBusy(true); try { await f(); } catch (e: any) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  const step = JOB_STEPS.findIndex(s => s[0] === j.status); const pro = pros.find(p => p.id === j.proId); const warrantyKids = jobs.filter(x => x.warrantyOf === j.id);
  return <ScrollView testID="job-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink }}>{j.serviceName}{j.warrantyOf ? ' · warranty visit' : ''}</Text>
    <Text style={{ fontFamily: F.body, color: K.muted }}>{j.id} · {fmtDay(j.slotStartMs)} · {j.slotLabel}</Text>
    <Card style={{ marginTop: 12 }} testID="job-status"><Text testID="job-status-text" style={{ fontFamily: F.display, fontSize: 20, color: K.ink }}>{JOB_LABEL[j.status]}</Text>
      {j.status !== 'cancelled' && JOB_STEPS.map(([k, l], i) => <Text key={k} style={{ fontFamily: i <= step ? F.bold : F.body, color: i <= step ? K.ink : K.muted, marginTop: 2 }}>{i <= step ? '●' : '○'} {l}</Text>)}
      {pro && <Text style={{ fontFamily: F.bold, color: K.ink2, marginTop: 8 }}>👷 {pro.name} · ★ {pro.rating || 'new'} · {pro.jobsDone} jobs{pro.policeVerified ? ' · police-verified ✓' : ''}</Text>}
      {j.status === 'requested' && <Text style={{ fontFamily: F.body, color: K.muted, marginTop: 6 }}>All pros are busy in this slot — our team will assign one shortly and you'll see it here.</Text>}</Card>
    {sec && ['assigned', 'en_route', 'requested'].includes(j.status) && <CodeBox label="Start OTP — share only when the pro is at your door" code={sec.startOtp} testID="job-start-otp" />}
    {sec && ['started', 'quoted', 'quote_approved', 'quote_declined'].includes(j.status) && <CodeBox label="Finish OTP — share when the work is done" code={sec.finishOtp} testID="job-finish-otp" />}
    {j.quoteLines && <><Title en="Quote" ta="மதிப்பீடு" /><Card testID="job-quote">{j.quoteLines.map((l, i) => <Kv key={i} k={l.label} v={rs(l.amount)} />)}<Kv k="Inspection" v={rs(j.inspectionFee)} /><Kv bold k="Total if approved" v={rs(j.inspectionFee + (j.quoteTotal || 0))} />
      {j.status === 'quoted' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><Button testID="quote-approve" kind="green" title="Approve" style={{ flex: 1 }} disabled={busy} onPress={run(() => api.models.jobDecide(j.id, true))} />
        <Button testID="quote-decline" kind="ghost" title={`Decline (pay ₹${j.inspectionFee})`} style={{ flex: 1 }} disabled={busy} onPress={run(() => api.models.jobDecide(j.id, false))} /></View>}</Card></>}
    <Card style={{ marginTop: 10 }}><Kv bold k={j.status === 'done' ? (j.paymentStatus === 'collected' ? `Paid (${j.collectedVia})` : 'To pay') : 'Payable so far'} v={rs(jobPayable(j))} testID="job-payable" /></Card>
    {!!err && <Banner tone="error" title={err} testID="job-error" />}
    {['requested', 'assigned'].includes(j.status) && <Button testID="job-cancel" kind="ghost" title="Cancel booking (free)" disabled={busy} style={{ marginTop: 10 }} onPress={run(() => api.models.jobCancel(j.id))} />}
    {j.status === 'done' && !j.rating && <><Title en="Rate the pro" ta="மதிப்பிடுங்கள்" /><Stars value={stars} onChange={setStars} testID="job-stars" /><Field label="Review (optional)" value={review} onChangeText={setReview} testID="job-review" maxLength={200} />
      <Button testID="job-rate" kind="dark" title="Submit rating" disabled={!stars || busy} reason={!stars ? 'Tap the stars' : undefined} style={{ marginTop: 10 }} onPress={run(() => api.models.jobRate(j.id, stars, review.trim()))} /></>}
    {!!j.rating && <Text testID="job-rated" style={{ fontFamily: F.bold, color: K.green, marginTop: 10 }}>Thanks! You rated {j.rating}★</Text>}
    {inWarranty(j) && <><Title en="Problem came back?" ta="மீண்டும் பிரச்சனையா?" /><Card testID="job-warranty"><Text style={{ fontFamily: F.body, color: K.ink2 }}>Free re-visit by the same pro until {fmtDay(j.warrantyUntilMs!)} — no inspection fee.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>{SLOTS.slice(0, 4).map(([k, l]) => <Chip key={k} testID={'wslot-' + k} label={'Tomorrow ' + l} on={wslot === k} onPress={() => setWslot(k)} />)}</View>
      {warrantyKids.length ? <Text style={{ fontFamily: F.bold, color: K.green }}>Warranty visit booked ({warrantyKids[0].id}).</Text> :
        <Button testID="job-warranty-claim" kind="primary" title="Claim warranty visit" disabled={!wslot || busy} reason={!wslot ? 'Pick a slot' : undefined} onPress={run(async () => { const w = await api.models.bookJob({ serviceId: j.serviceId, address: j.address, problem: 'Warranty: ' + j.problem, slotDate: istDate(Date.now() + DAY), slot: wslot, pay: j.pay, warrantyOf: j }, pros); router.push(`/job/${w.id}`); })} />}</Card></>}
  </ScrollView>;
}
