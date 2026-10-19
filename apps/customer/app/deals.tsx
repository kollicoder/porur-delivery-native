/** Surplus flash deals: tonight's leftover food from FSSAI-licensed kitchens, ≥30% off, 60–90 minutes, first come first served. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Switch } from 'react-native';
import { Deal, DealClaim, DealPrefs, DEALS, AREAS, isDealLive, kmBetween, fmtLeft, fmtTime, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Stepper, Segmented, Pill } from '@porur/shared/src/ui/kit';
import { Title, Chip, Field, Kv, CodeBox, Stars, useNow } from '@porur/shared/src/ui/kit2';
import { api } from '../src/store';

export default function Deals() {
  const now = useNow(15000); const [deals, setDeals] = useState<Deal[] | null>(null); const [claims, setClaims] = useState<DealClaim[]>([]); const [prefs, setPrefs] = useState<DealPrefs | null>(null); const [openId, setOpenId] = useState(''); const [kill, setKill] = useState(false);
  useEffect(() => { const m = api.models; const subs = [m.watchLiveDeals(setDeals), m.watchMyClaims(setClaims), m.watchPrefs(setPrefs), m.watchDealsCfg(c => setKill(!!c.killAll))]; return () => subs.forEach(f => f()); }, []);
  const here = prefs ? { lat: prefs.lat, lng: prefs.lng } : { lat: AREAS[0][1], lng: AREAS[0][2] };
  const live = kill ? [] : (deals || []).filter(d => isDealLive(d, now) && kmBetween(here, d) <= (prefs?.radiusKm || DEALS.radiusKm) + 2);
  return <ScrollView testID="deals-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View style={{ backgroundColor: K.orangeBright, borderRadius: 26, padding: 18 }}>
      <Text style={{ fontFamily: F.bold, color: K.ink, fontSize: 13 }}>🔥 TONIGHT'S SURPLUS · 9–11 PM</Text>
      <Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink, lineHeight: 29 }}>Fresh leftover food, 30–60% off</Text>
      <Text style={{ fontFamily: F.ta, fontSize: 12, color: K.ink }}>இன்றைய மீதமுள்ள உணவு · குறைந்த விலையில்</Text>
      <Text style={{ fontFamily: F.body, color: K.ink, marginTop: 8, fontSize: 13 }}>Only FSSAI-licensed kitchens · cooked today · pickup with a code, or ₹{DEALS.deliveryFee} batched delivery where offered.</Text>
    </View>
    <Title en="Live near you" ta="அருகில் இப்போது" />
    {!deals ? <SkeletonList n={3} testID="deals-loading" /> : live.length === 0 ? <Empty testID="deals-empty" emoji="🌙" title="No deals live right now" body="Kitchens post surplus between 9 and 11 pm. Turn on alerts below and we'll tell you (max once a day)." /> :
      live.map(d => <DealCard key={d.id} d={d} now={now} here={here} open={openId === d.id} onOpen={() => setOpenId(openId === d.id ? '' : d.id)} />)}
    <Title en="Your claims" ta="உங்கள் கோரிக்கைகள்" />
    {claims.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>Nothing claimed yet.</Text> : claims.map(c => <ClaimCard key={c.id} c={c} />)}
    <Alerts prefs={prefs} />
  </ScrollView>;
}
function DealCard({ d, now, here, open, onOpen }: { d: Deal; now: number; here: { lat: number; lng: number }; open: boolean; onOpen: () => void }) {
  const [qty, setQty] = useState(1); const [ful, setFul] = useState<'pickup' | 'delivery'>('pickup'); const [addr, setAddr] = useState(''); const [pay, setPay] = useState<'COD' | 'UPI_DOD'>('UPI_DOD'); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const max = Math.min(3, d.qtyLeft); const total = qty * d.dealPrice + (ful === 'delivery' ? d.deliveryFee : 0);
  const claim = async () => { setErr(''); if (ful === 'delivery' && !addr.trim()) return setErr('Add the delivery address.'); setBusy(true);
    try { await api.models.claimDeal(d, qty, ful, pay, ful === 'delivery' ? addr.trim() : undefined); setOk('Claimed! Your pickup code is below in "Your claims".'); } catch (e: any) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  return <Card testID={'deal-' + d.id} style={{ marginBottom: 10 }}>
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: K.orangeSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32 }}>{d.emoji || '🍱'}</Text></View>
      <View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{d.item}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{d.storeName} · {kmBetween(here, d).toFixed(1)} km · {d.veg ? '🟢 veg' : '🔴 non-veg'}</Text>
        <Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{rs(d.dealPrice)} <Text style={{ fontFamily: F.body, fontSize: 13, color: K.muted, textDecorationLine: 'line-through' }}>{rs(d.regularPrice)}</Text> <Text style={{ fontFamily: F.bold, fontSize: 13, color: K.green }}>{d.discountPct}% off</Text></Text></View>
    </View>
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}><Pill label={`⏳ ${fmtLeft(d.expiresAtMs - now)} left`} bg={K.yellowSoft} /><Pill label={`${d.qtyLeft} of ${d.qtyTotal} left`} bg={d.qtyLeft <= 3 ? K.redSoft : K.greenSoft} /><Pill label={d.fulfil === 'both' ? 'Pickup / ₹39 delivery' : 'Pickup only'} /></View>
    <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted, marginTop: 6 }}>Cooked {d.preparedAt} · FSSAI {d.fssaiNo}{d.allergens ? ' · contains ' + d.allergens : ''}</Text>
    {ok ? <Banner tone="ok" icon="✅" title={ok} testID="claim-ok" /> : !open ? <Button testID={'deal-open-' + d.id} kind="dark" title="Claim" onPress={onOpen} style={{ marginTop: 8 }} /> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>How many? (max {max})</Text><Stepper testID="claim-qty" value={qty} onChange={n => setQty(Math.max(1, Math.min(max, n)))} /></View>
      {d.fulfil === 'both' && <View style={{ marginTop: 8 }}><Segmented value={ful} onChange={setFul} options={[['pickup', '🏃 Pickup (free)'], ['delivery', `🛵 Delivery ₹${d.deliveryFee}`]] as const} /></View>}
      {ful === 'delivery' && <Field label="Delivery address" value={addr} onChangeText={setAddr} testID="claim-address" maxLength={160} />}
      <View style={{ marginTop: 8 }}><Segmented value={pay} onChange={setPay} options={[['UPI_DOD', '📱 UPI'], ['COD', '💵 Cash']] as const} /></View>
      {!!err && <Banner tone="error" title={err} testID="claim-error" />}
      <Button testID="claim-confirm" kind="primary" title={busy ? 'Claiming…' : `Claim ${qty} · pay ${rs(total)} at ${ful === 'pickup' ? 'pickup' : 'the door'}`} disabled={busy} onPress={claim} style={{ marginTop: 10 }} />
    </>}
  </Card>;
}
function ClaimCard({ c }: { c: DealClaim }) {
  const [code, setCode] = useState<string | null>(null); const [stars, setStars] = useState(0); const [complaint, setComplaint] = useState(''); const [err, setErr] = useState('');
  useEffect(() => api.models.watchClaimCode(c.id, setCode), [c.id]); const done = c.status === 'picked_up' || c.status === 'delivered';
  return <Card testID={'claim-' + c.id} style={{ marginBottom: 8 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{c.item} × {c.qty} · {c.storeName}</Text><Pill label={c.status.replace('_', ' ')} bg={done ? K.greenSoft : K.yellowSoft} /></View>
    <Kv k={c.fulfil === 'pickup' ? 'Pay at pickup' : `Pay at door (incl. ₹${c.deliveryFee})`} v={rs(c.total)} />
    {c.status === 'claimed' && <CodeBox label={c.fulfil === 'pickup' ? 'Show this code at the counter' : 'Give this code to the rider'} code={code} testID="claim-code" sub={`Collect before ${fmtTime(c.expiresAtMs)}`} />}
    {done && !c.rating && <><Text style={{ fontFamily: F.bold, color: K.ink, marginTop: 6 }}>How was it?</Text><Stars value={stars} onChange={setStars} testID="claim-stars" />
      <Field label="Problem? (optional — goes to Porur support)" value={complaint} onChangeText={setComplaint} testID="claim-complaint" placeholder="e.g. cold, stale, wrong item" maxLength={200} />
      {!!err && <Banner tone="error" title={err} />}<Button testID="claim-rate" kind="dark" title="Submit" disabled={!stars} reason={!stars ? 'Tap the stars' : undefined} style={{ marginTop: 8 }} onPress={() => api.models.rateClaim(c.id, stars, complaint.trim()).catch(e => setErr(e.message))} /></>}
    {!!c.rating && <Text style={{ fontFamily: F.bold, color: K.green }}>You rated {c.rating}★{c.complaint ? ' · complaint sent' : ''}</Text>}
  </Card>;
}
function Alerts({ prefs }: { prefs: DealPrefs | null }) {
  const [p, setP] = useState<DealPrefs>({ optIn: false, radiusKm: 3, vegOnly: false, area: AREAS[0][0], lat: AREAS[0][1], lng: AREAS[0][2] }); const [saved, setSaved] = useState('');
  useEffect(() => { if (prefs) setP(x => ({ ...x, ...prefs })); }, [prefs]);
  const save = (n: DealPrefs) => { setP(n); setSaved(''); api.models.savePrefs({ optIn: n.optIn, radiusKm: n.radiusKm, vegOnly: n.vegOnly, area: n.area, lat: n.lat, lng: n.lng }).then(() => setSaved('Saved')).catch(e => setSaved(e.message)); };
  return <><Title en="Deal alerts" ta="அறிவிப்புகள்" /><Card testID="deal-alerts">
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}><View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>Tell me when a deal goes live</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>Max one alert a day · never after 10:30 pm</Text></View>
      <Switch testID="alerts-toggle" accessibilityLabel="Deal alerts" value={p.optIn} onValueChange={v => save({ ...p, optIn: v })} trackColor={{ true: K.green, false: K.line }} /></View>
    {p.optIn && <><Text style={{ fontFamily: F.bold, color: K.ink2, marginTop: 8 }}>Your area</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{AREAS.map(([a, lat, lng]) => <Chip key={a} testID={'area-' + a} label={a} on={p.area === a} onPress={() => save({ ...p, area: a, lat, lng })} />)}</View>
      <Text style={{ fontFamily: F.bold, color: K.ink2 }}>Within</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{[1, 2, 3].map(r => <Chip key={r} label={`${r} km`} on={p.radiusKm === r} onPress={() => save({ ...p, radiusKm: r })} />)}
        <Chip testID="alerts-veg" label="🟢 Veg only" on={p.vegOnly} onPress={() => save({ ...p, vegOnly: !p.vegOnly })} /></View></>}
    {!!saved && <Text testID="alerts-saved" style={{ fontFamily: F.bold, color: saved === 'Saved' ? K.green : K.red }}>{saved}</Text>}
  </Card></>;
}
