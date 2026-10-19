/** Office lunch: home-cooked meals for teams. ≥5 packs, ₹130–150, order by 8 pm the evening before, delivered 12:15–12:45. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Cook, MealMenu, LunchOrder, Drop, LUNCH, OFFICES, nextLunchDate, lunchTotals, lunchCutoffMs, fmtDay, fmtLeft, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Stepper, Segmented, Pill } from '@porur/shared/src/ui/kit';
import { Title, Chip, Field, Kv, CodeBox, useNow } from '@porur/shared/src/ui/kit2';
import { api, useApp } from '../src/store';
const dayMs = (d: string) => Date.parse(d + 'T06:30:00Z');

export default function Lunch() {
  const { me } = useApp(); const now = useNow(60000); const date = nextLunchDate(now);
  const [menus, setMenus] = useState<MealMenu[] | null>(null); const [cooks, setCooks] = useState<Cook[]>([]); const [mine, setMine] = useState<LunchOrder[]>([]);
  const [mid, setMid] = useState(''); const [veg, setVeg] = useState(5); const [nv, setNv] = useState(0); const [company, setCompany] = useState(me?.office?.company || ''); const [officeId, setOfficeId] = useState(me?.office?.officeId || OFFICES[0].id);
  const [floor, setFloor] = useState(''); const [pay, setPay] = useState<'COD' | 'UPI_DOD'>('UPI_DOD'); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => { const m = api.models; const subs = [m.watchMenus(date, setMenus), m.watchCooks(setCooks), m.watchMyLunch(setMine)]; return () => subs.forEach(f => f()); }, [date]);
  const active = (menus || []).filter(m => cooks.find(c => c.id === m.cookId)?.status !== 'paused');
  const menu = active.find(m => m.id === mid) || (active.length === 1 ? active[0] : undefined); const tot = menu ? lunchTotals(veg, nv, menu, now) : null;
  const place = async () => { if (!menu) return; setErr(''); setOk(''); if (!company.trim()) return setErr('Add your company name for the invoice and reception.');
    setBusy(true); try { const off = OFFICES.find(o => o.id === officeId)!; const id = await api.models.placeLunch(menu, { company: company.trim(), officeId, office: off.name, floor: floor.trim() || undefined, vegPacks: veg, nonVegPacks: nv, pay });
      api.updateMe({ office: { company: company.trim(), officeId, ...(floor.trim() ? { floor: floor.trim() } : {}) } } as any).catch(() => {}); setOk(`Order ${id} placed for ${fmtDay(dayMs(date))}. The cook confirms by 9 pm.`); } catch (e: any) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  return <ScrollView testID="lunch-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View style={{ backgroundColor: K.yellow, borderRadius: 26, padding: 18 }}>
      <Text style={{ fontFamily: F.bold, color: K.ink2, fontSize: 13 }}>🍱 OFFICE LUNCH · {fmtDay(dayMs(date)).toUpperCase()}</Text>
      <Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink, lineHeight: 29 }}>Home-cooked lunch for your team, {LUNCH.slot}</Text>
      <Text style={{ fontFamily: F.ta, fontSize: 12, color: K.ink2 }}>வீட்டு சாப்பாடு · அலுவலகத்திற்கு</Text>
      <Text testID="lunch-cutoff" style={{ fontFamily: F.bold, color: K.ink, marginTop: 8 }}>Order closes in {fmtLeft(lunchCutoffMs(date) - now)} (8 pm the evening before) · min {LUNCH.minPacks} packs · ₹{LUNCH.minPrice}–{LUNCH.maxPrice}/pack</Text>
    </View>
    <Title en="Tomorrow's cooks" ta="நாளைய சமையல்காரர்கள்" />
    {!menus ? <SkeletonList n={3} testID="lunch-loading" /> : active.length === 0 ? <Empty testID="lunch-empty" emoji="👩‍🍳" title="No menus yet for this day" body="Our FSSAI-registered home cooks post menus by 6 pm. Check again this evening." /> :
      active.map(m => { const c = cooks.find(x => x.id === m.cookId); const left = m.capacity - m.booked; const on = menu?.id === m.id;
        return <Card key={m.id} testID={'menu-' + m.cookId} style={{ marginBottom: 8, borderWidth: 2, borderColor: on ? K.ink : K.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{m.cookName}</Text><Pill label={left > 0 ? `${left} left` : 'Full'} bg={left > 0 ? K.greenSoft : K.redSoft} /></View>
          <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{c?.kitchen || 'Home kitchen'} · {c?.area} · ★ {c?.rating || 'new'} · FSSAI {c?.fssaiNo}</Text>
          <Kv k={`🟢 ${m.vegDish}`} v={rs(m.vegPrice)} />{!!m.nonVegDish && <Kv k={`🔴 ${m.nonVegDish}`} v={rs(m.nonVegPrice!)} />}
          <Button testID={'pick-' + m.cookId} kind={on ? 'dark' : 'ghost'} title={on ? '✓ Selected' : 'Order from this cook'} disabled={left <= 0} onPress={() => setMid(m.id)} style={{ marginTop: 6 }} />
        </Card>; })}
    {menu && tot && <>
      <Title en="Packs" ta="பொட்டலங்கள்" />
      <Card><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontFamily: F.bold, color: K.ink }}>🟢 Veg · {rs(menu.vegPrice)}</Text><Stepper testID="lunch-veg" value={veg} onChange={n => setVeg(Math.max(0, n))} /></View>
        {!!menu.nonVegPrice && <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>🔴 Non-veg · {rs(menu.nonVegPrice)}</Text><Stepper testID="lunch-nonveg" value={nv} onChange={n => setNv(Math.max(0, n))} /></View>}</Card>
      <Title en="Office" ta="அலுவலகம்" />
      <Field label="Company name" value={company} onChangeText={setCompany} testID="lunch-company" placeholder="e.g. Acme Analytics" maxLength={60} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>{OFFICES.map(o => <Chip key={o.id} testID={'office-' + o.id} label={o.short} on={o.id === officeId} onPress={() => setOfficeId(o.id)} />)}</View>
      <Field label="Floor / reception note (optional)" value={floor} onChangeText={setFloor} testID="lunch-floor" placeholder="4th floor, ask for Priya" maxLength={60} />
      <Title en="Pay on delivery" ta="டெலிவரியில் பணம்" /><Segmented value={pay} onChange={setPay} options={[['UPI_DOD', '📱 UPI'], ['COD', '💵 Cash']] as const} />
      <Card style={{ marginTop: 12 }} testID="lunch-summary"><Kv k={`${tot.packs} packs (${veg} veg · ${nv} non-veg)`} v={rs(tot.total)} /><Kv k="Delivery (batched run)" v="Free" /><Kv bold k="Total" v={rs(tot.total)} />
        {tot.errors.map(e => <Text key={e} style={{ fontFamily: F.bold, color: K.orange, marginTop: 4 }}>{e}</Text>)}</Card>
      {!!err && <Banner tone="error" title={err} testID="lunch-error" />}
      <Button testID="lunch-place" kind="primary" title={busy ? 'Placing…' : `Place team order · ${rs(tot.total)}`} disabled={busy || !tot.ok} reason={tot.errors[0]} onPress={place} style={{ marginTop: 12 }} />
    </>}
    {!!ok && <Banner tone="ok" icon="✅" title={ok} testID="lunch-ok" />}
    <Title en="Your team orders" ta="உங்கள் ஆர்டர்கள்" />
    {mine.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>No orders yet.</Text> : mine.map(o => <LunchCard key={o.id} o={o} />)}
  </ScrollView>;
}
function LunchCard({ o }: { o: LunchOrder }) {
  const [code, setCode] = useState<string | null>(null); useEffect(() => { if (o.dropId) return api.models.watchDropCode(o.dropId, setCode); }, [o.dropId]);
  return <Card testID={'lunch-' + o.id} style={{ marginBottom: 8 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{o.id} · {fmtDay(dayMs(o.date))} {o.slot}</Text><Pill label={o.status.replace('_', ' ')} bg={o.status === 'delivered' ? K.greenSoft : K.yellowSoft} /></View>
    <Text style={{ fontFamily: F.body, color: K.ink2, fontSize: 13 }}>{o.company} · {o.office}</Text><Kv k={`${o.vegPacks} veg · ${o.nonVegPacks} non-veg`} v={rs(o.total)} />
    {code && o.status !== 'delivered' && <CodeBox label="Reception gives this code to the rider" code={code} testID="lunch-code" />}</Card>;
}
