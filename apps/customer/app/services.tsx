/** Home services: verified plumber / electrician / appliance repair / deep cleaning. 2-hour slot, ₹149 inspection, OTP start & finish, 30-day warranty. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Job, Pro, SERVICES, SERVICE_FEE, SLOTS, WARRANTY_DAYS, slotStartMs, istDate, fmtDay, rs, HOUR, DAY } from '@porur/shared';
import { K, F, Button, Card, Banner, Segmented, Pill, TAP } from '@porur/shared/src/ui/kit';
import { Title, Chip, Field, Kv } from '@porur/shared/src/ui/kit2';
import { api } from '../src/store';
export const JOB_LABEL: Record<string, string> = { requested: 'Finding a pro', assigned: 'Pro assigned', en_route: 'On the way', started: 'Inspecting', quoted: 'Quote waiting', quote_approved: 'Working', quote_declined: 'Inspection only', done: 'Done', cancelled: 'Cancelled' };

export default function Services() {
  const [svc, setSvc] = useState(''); const [pros, setPros] = useState<Pro[]>([]); const [jobs, setJobs] = useState<Job[]>([]);
  const days = [0, 1, 2, 3].map(i => istDate(Date.now() + i * DAY)); const [date, setDate] = useState(days[0]); const [slot, setSlot] = useState('');
  const [addr, setAddr] = useState(''); const [problem, setProblem] = useState(''); const [pay, setPay] = useState<'COD' | 'UPI_DOD'>('UPI_DOD'); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { const m = api.models; const subs = [m.watchPros(setPros), m.watchMyJobs(setJobs)]; return () => subs.forEach(f => f()); }, []);
  const s = SERVICES.find(x => x.id === svc); const slots = SLOTS.filter(([k]) => slotStartMs(date, k) > Date.now() + HOUR);
  const avail = (id: string) => pros.filter(p => p.status === 'active' && p.skills.includes(id)).length;
  const book = async () => { setErr(''); if (!s || !slot) return; if (!addr.trim()) return setErr('Add the address for the visit.');
    setBusy(true); try { const j = await api.models.bookJob({ serviceId: s.id, address: addr.trim(), problem: problem.trim() || s.blurb, slotDate: date, slot, pay }, pros); router.push(`/job/${j.id}`); setSlot(''); setProblem(''); }
    catch (e: any) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  return <ScrollView testID="services-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View style={{ backgroundColor: K.blueSoft, borderRadius: 26, padding: 18 }}>
      <Text style={{ fontFamily: F.bold, color: K.blue, fontSize: 13 }}>🛠️ HOME SERVICES · PORUR</Text>
      <Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink, lineHeight: 29 }}>Verified pros in a 2-hour slot</Text>
      <Text style={{ fontFamily: F.ta, fontSize: 12, color: K.ink2 }}>சரிபார்க்கப்பட்ட நிபுணர்கள் · போலீஸ் சரிபார்ப்பு</Text>
      <Text style={{ fontFamily: F.body, color: K.ink2, marginTop: 8, fontSize: 13 }}>₹{SERVICE_FEE} inspection (adjusted if you go ahead) · quote before any work · OTP at start & finish · {WARRANTY_DAYS}-day warranty</Text>
    </View>
    <Title en="What do you need?" ta="என்ன சேவை?" />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>{SERVICES.map(x => <Pressable key={x.id} testID={'svc-' + x.id} accessibilityRole="button" accessibilityState={{ selected: svc === x.id }} onPress={() => setSvc(x.id)}
      style={{ width: '48.5%', minHeight: 112, borderRadius: 22, padding: 12, backgroundColor: svc === x.id ? K.ink : K.card, borderWidth: 1, borderColor: svc === x.id ? K.ink : K.line }}>
      <Text style={{ fontSize: 28 }}>{x.emoji}</Text><Text style={{ fontFamily: F.display, fontSize: 17, color: svc === x.id ? '#fff' : K.ink }}>{x.name}</Text>
      <Text style={{ fontFamily: F.ta, fontSize: 12, color: svc === x.id ? '#E9E4D8' : K.muted }}>{x.ta}</Text><Text style={{ fontFamily: F.bold, fontSize: 11, color: svc === x.id ? K.yellow : K.green, marginTop: 2 }}>{avail(x.id) ? `${avail(x.id)} pro${avail(x.id) > 1 ? 's' : ''} nearby` : 'On request'}</Text></Pressable>)}</View>
    {s && <>
      <Card style={{ marginTop: 12 }} testID="rate-card"><Text style={{ fontFamily: F.bold, color: K.ink, marginBottom: 4 }}>Typical prices · {s.name}</Text>{s.rateCard.map(([k, v]) => <Kv key={k} k={k} v={'from ' + rs(v)} />)}
        <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted, marginTop: 4 }}>Parts extra at MRP. You approve the quote in the app before work starts.</Text></Card>
      <Title en="Pick a 2-hour slot" ta="நேரம் தேர்வு" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{days.map((d, i) => <Chip key={d} testID={'day-' + i} label={i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDay(Date.parse(d + 'T06:00:00Z'))} on={d === date} onPress={() => { setDate(d); setSlot(''); }} />)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{slots.length ? slots.map(([k, l]) => <Chip key={k} testID={'slot-' + k} label={l} on={slot === k} onPress={() => setSlot(k)} />) : <Text style={{ fontFamily: F.body, color: K.muted }}>No more slots today — pick tomorrow.</Text>}</View>
      <Field label="Address" value={addr} onChangeText={setAddr} testID="svc-address" placeholder="Flat, street, landmark" multiline maxLength={160} />
      <Field label="What's the problem? (optional)" value={problem} onChangeText={setProblem} testID="svc-problem" placeholder={s.blurb} maxLength={200} />
      <Title en="Pay after the visit" ta="வேலைக்குப் பிறகு பணம்" /><Segmented value={pay} onChange={setPay} options={[['UPI_DOD', '📱 UPI'], ['COD', '💵 Cash']] as const} />
      {!!err && <Banner tone="error" title={err} testID="svc-error" />}
      <Button testID="svc-book" kind="primary" title={busy ? 'Booking…' : `Book · ₹${SERVICE_FEE} inspection`} disabled={busy || !slot} reason={!slot ? 'Pick a slot' : undefined} onPress={book} style={{ marginTop: 12 }} />
    </>}
    <Title en="Your bookings" ta="உங்கள் முன்பதிவுகள்" />
    {jobs.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>No bookings yet.</Text> : jobs.map(j => <Pressable key={j.id} testID={'job-' + j.id} onPress={() => router.push(`/job/${j.id}`)} style={{ minHeight: TAP }}>
      <Card style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{SERVICES.find(x => x.id === j.serviceId)?.emoji} {j.serviceName}{j.warrantyOf ? ' · warranty' : ''}</Text><Pill label={JOB_LABEL[j.status]} bg={j.status === 'done' ? K.greenSoft : K.yellowSoft} /></View>
        <Text style={{ fontFamily: F.body, fontSize: 13, color: K.muted }}>{fmtDay(j.slotStartMs)} · {j.slotLabel}{j.proName ? ' · ' + j.proName : ''}</Text></Card></Pressable>)}
  </ScrollView>;
}
