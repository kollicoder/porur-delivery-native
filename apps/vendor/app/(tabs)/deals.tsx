/** Surplus flash deals for FSSAI kitchens: say it (Tamil/English) or type it → confirm → live for 60–90 min. */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { Deal, DealClaim, DealDraft, DEALS, FOOD_PRODUCTS, parseDeal, validateDeal, isDealLive, fmtLeft, fmtTime, istHourFloat, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Stepper, Segmented, Pill, TAP } from '@porur/shared/src/ui/kit';
import { Title, Chip, Field, Kv, useNow } from '@porur/shared/src/ui/kit2';
import { api, useVendor, useProducts } from '../../src/store';
import { listen, speechAvailable } from '../../src/speech';
import { s } from '../../src/theme';

export default function Deals() {
  const { store, storeDoc } = useVendor(); const products = useProducts(); const now = useNow(15000);
  const [cfg, setCfg] = useState<any>(null); const [cap, setCap] = useState({ deals: 0, units: 0 }); const [deals, setDeals] = useState<Deal[] | null>(null); const [claims, setClaims] = useState<DealClaim[]>([]);
  const [text, setText] = useState(''); const [lang, setLang] = useState<'ta-IN' | 'en-IN'>('ta-IN'); const [listening, setListening] = useState(false); const stop = useRef<null | (() => void)>(null);
  const [draft, setDraft] = useState<DealDraft | null>(null); const [msg, setMsg] = useState('');
  useEffect(() => { if (!store) return; const m = api.models; const subs = [m.watchDealsCfg(setCfg), m.watchCap(store.id, setCap), m.watchStoreDeals(store.id, setDeals), m.watchStoreClaims(store.id, setClaims)]; return () => subs.forEach(f => f()); }, [store?.id]);
  if (!store || !storeDoc || !deals) return <ScrollView contentContainerStyle={{ padding: 16 }}><SkeletonList n={4} testID="deals-loading" /></ScrollView>;
  if (!storeDoc.dealsApproved || !storeDoc.fssaiNo) return <Empty testID="deals-locked" emoji="🔒" title="Surplus deals need an FSSAI licence" body="Only FSSAI-licensed kitchens can post surplus food. Send your licence number to the Porur team to get approved." />;
  const cat = products.map(p => ({ ...p, kw: (FOOD_PRODUCTS.find(f => f.id === p.id) as any)?.kw || (p as any).kw }));
  const h = istHourFloat(now); const inWindow = cfg?.anyTime || (h >= (cfg?.fromHour ?? DEALS.fromHour) && h < (cfg?.toHour ?? DEALS.toHour));
  const blocked = cfg?.killAll ? 'Deals are paused across Porur right now.' : storeDoc.dealsPaused ? `Your deals are paused: ${storeDoc.pauseReason || 'quality review'}.` : !inWindow ? `Deals can go live between ${cfg?.fromHour ?? 21}:00 and ${cfg?.toHour ?? 23}:00.` : '';
  const mic = async () => { if (listening) { stop.current?.(); setListening(false); return; } setMsg(''); setListening(true);
    stop.current = await listen(lang, (t, fin) => { setText(t); if (fin) { setListening(false); setDraft(parseDeal(t, cat)); } }, e => { setListening(false); if (e) setMsg(e); }); };
  const live = deals.filter(d => isDealLive(d, now)); const open = claims.filter(c => c.status === 'claimed');
  return <ScrollView testID="vendor-deals" contentContainerStyle={{ padding: 16, paddingBottom: 130 }}>
    <View style={{ backgroundColor: K.orangeBright, borderRadius: 24, padding: 16 }}>
      <Text style={{ fontFamily: F.display, fontSize: 22, color: K.ink }}>🔥 Post tonight's surplus</Text><Text style={{ fontFamily: F.ta, fontSize: 12, color: K.ink }}>மீதமுள்ள உணவை விற்கவும் — பேசுங்கள் அல்லது டைப் செய்யுங்கள்</Text>
      <Text testID="deal-cap" style={{ fontFamily: F.bold, color: K.ink, marginTop: 6 }}>Tonight: {cap.deals}/{DEALS.capDeals} deals · {cap.units}/{DEALS.capUnits} portions · ≥30% off · 60–90 min</Text></View>
    {!!blocked && <Banner tone="warn" title={blocked} testID="deal-blocked" />}
    {!draft ? <Card style={{ marginTop: 12 }} testID="deal-input">
      <Text style={{ fontFamily: F.bold, color: K.ink }}>Say it like: “பத்து பிரியாணி நூறு ரூபாய் தள்ளுபடி” or “5 parotta at 40% off for 90 minutes”</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><Chip label="தமிழ்" on={lang === 'ta-IN'} onPress={() => setLang('ta-IN')} /><Chip label="English" on={lang === 'en-IN'} onPress={() => setLang('en-IN')} /></View>
      {speechAvailable() && <Pressable testID="deal-mic" accessibilityLabel="Speak your deal" onPress={mic} style={{ alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: listening ? K.red : K.ink, alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}><Text style={{ fontSize: 34 }}>{listening ? '■' : '🎤'}</Text></Pressable>}
      <TextInput testID="deal-text" accessibilityLabel="Deal text" style={[s.input, { minHeight: 72 }]} multiline value={text} onChangeText={setText} placeholder={speechAvailable() ? 'Or type it here' : 'Voice needs the installed app — type it here'} placeholderTextColor={K.muted} />
      {!!msg && <Text style={{ fontFamily: F.body, color: K.orange, marginTop: 4 }}>{msg}</Text>}
      <Button testID="deal-parse" kind="dark" title="Next: check details" disabled={!text.trim()} style={{ marginTop: 10 }} onPress={() => setDraft(parseDeal(text, cat))} />
      <Button testID="deal-form" kind="ghost" title="Fill a form instead" style={{ marginTop: 6 }} onPress={() => setDraft({ minutes: 60, fulfil: 'pickup', notes: [] })} />
    </Card> : <Confirm draft={draft} cat={cat} cap={cap} blocked={blocked} transcript={text} onDone={m => { setDraft(null); setText(''); setMsg(m); }} onBack={() => setDraft(null)} />}
    {!!msg && !draft && <Banner tone="ok" icon="✅" title={msg} testID="deal-published" />}
    <Title en={`Live now (${live.length})`} ta="இப்போது" />
    {live.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>No live deals.</Text> : live.map(d => <Card key={d.id} testID={'vd-' + d.id} style={{ marginBottom: 8 }}>
      <Kv k={`${d.emoji || ''} ${d.item} · ${rs(d.dealPrice)} (${d.discountPct}% off)`} v={`${d.qtyLeft}/${d.qtyTotal} left`} /><Text style={{ fontFamily: F.body, color: K.muted }}>Ends in {fmtLeft(d.expiresAtMs - now)} · {d.fulfil === 'both' ? 'pickup + delivery' : 'pickup only'}</Text>
      <Button kind="ghost" title="Stop this deal" style={{ marginTop: 6 }} onPress={() => api.models.removeDeal(d.id)} /></Card>)}
    <Title en={`Pickups to hand over (${open.length})`} ta="வாடிக்கையாளர் வருகை" />
    {open.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>Nobody waiting.</Text> : open.map(c => <Handover key={c.id} c={c} now={now} />)}
  </ScrollView>;
}
function Confirm({ draft, cat, cap, blocked, transcript, onDone, onBack }: { draft: DealDraft; cat: any[]; cap: { deals: number; units: number }; blocked: string; transcript: string; onDone: (m: string) => void; onBack: () => void }) {
  const { store, storeDoc } = useVendor(); const [pid, setPid] = useState(draft.productId || ''); const p = cat.find(x => x.id === pid);
  const [qty, setQty] = useState(draft.qty || 5); const [price, setPrice] = useState(draft.dealPrice ? String(draft.dealPrice) : ''); const [mins, setMins] = useState(draft.minutes || 60); const [ful, setFul] = useState<'pickup' | 'both'>(draft.fulfil);
  const [prep, setPrep] = useState(fmtTime(Date.now() - 30 * 60e3)); const [allergens, setAllergens] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (p && !price && draft.offPct != null) setPrice(String(Math.round(p.price * (1 - draft.offPct / 100)))); else if (p && !price && draft.offRs != null) setPrice(String(p.price - draft.offRs)); }, [pid]);
  const v = p ? validateDeal({ qty, regularPrice: p.price, dealPrice: Number(price), minutes: mins }, cap) : null;
  const publish = async () => { if (!p || !store) return; setErr(''); setBusy(true);
    try { await api.models.createDeal({ id: store.id, name: store.name, fssaiNo: storeDoc?.fssaiNo, lat: (store as any).lat, lng: (store as any).lng }, { id: p.id, name: p.name, ta: p.ta, emoji: p.emoji, price: p.price, veg: (FOOD_PRODUCTS.find(f => f.id === p.id) as any)?.veg ?? p.veg },
      { qty, dealPrice: Number(price), minutes: mins, fulfil: ful, preparedAt: prep.trim() || 'today', allergens: allergens.trim() || undefined, transcript: transcript.trim() || undefined });
      onDone(`${qty} × ${p.name} is live at ${rs(Number(price))} for ${mins} min. Nearby customers who opted in get one alert.`); } catch (e: any) { setErr(/permission/i.test(e.message) ? 'Not allowed right now — check the time window, price (≥30% off) and tonight\'s limits.' : e.message); } finally { setBusy(false); } };
  return <Card style={{ marginTop: 12, borderWidth: 2, borderColor: K.ink }} testID="deal-confirm">
    <Text style={{ fontFamily: F.display, fontSize: 20, color: K.ink }}>Check & confirm</Text><Text style={{ fontFamily: F.ta, fontSize: 12, color: K.muted }}>சரிபார்த்து உறுதி செய்யுங்கள்</Text>
    {!!transcript && <Text testID="deal-heard" style={{ fontFamily: F.body, color: K.ink2, marginTop: 4 }}>Heard: “{transcript}”</Text>}
    {draft.notes.map(n => <Text key={n} style={{ fontFamily: F.bold, color: K.orange, marginTop: 4 }}>{n}</Text>)}
    <Text style={{ fontFamily: F.bold, color: K.ink2, marginTop: 10 }}>Item</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{cat.map(x => <Chip key={x.id} testID={'dp-' + x.id} label={`${x.emoji} ${x.name} ₹${x.price}`} on={x.id === pid} onPress={() => setPid(x.id)} />)}</View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>Portions</Text><Stepper testID="deal-qty" value={qty} onChange={n => setQty(Math.max(1, Math.min(DEALS.capUnits, n)))} /></View>
    <Field label={p ? `Deal price (₹) — regular ${rs(p.price)}, max ${rs(Math.floor(p.price * DEALS.maxPriceRatio))}` : 'Deal price (₹)'} value={price} onChangeText={setPrice} testID="deal-price" keyboardType="number-pad" maxLength={4} />
    <Text style={{ fontFamily: F.bold, color: K.ink2, marginTop: 10 }}>Runs for</Text><View style={{ flexDirection: 'row', marginTop: 6 }}>{[60, 75, 90].map(m => <Chip key={m} testID={'dm-' + m} label={`${m} min`} on={mins === m} onPress={() => setMins(m)} />)}</View>
    <Segmented value={ful} onChange={setFul} options={[['pickup', '🏃 Pickup only'], ['both', `+ ₹${DEALS.deliveryFee} delivery`]] as const} />
    <Field label="Cooked at" value={prep} onChangeText={setPrep} testID="deal-prep" maxLength={20} /><Field label="Allergens (optional)" value={allergens} onChangeText={setAllergens} placeholder="nuts, dairy…" maxLength={60} />
    {v && <View testID="deal-checks" style={{ marginTop: 8 }}>{v.errors.map(e => <Text key={e} style={{ fontFamily: F.bold, color: K.red }}>✕ {e}</Text>)}{v.warnings.map(w => <Text key={w} style={{ fontFamily: F.body, color: K.orange }}>! {w}</Text>)}
      {v.ok && <Text style={{ fontFamily: F.bold, color: K.green }}>✓ {v.pct}% off · within tonight's limits</Text>}</View>}
    {!!err && <Banner tone="error" title={err} testID="deal-error" />}
    <Button testID="deal-publish" kind="primary" title={busy ? 'Publishing…' : 'Confirm & go live'} disabled={busy || !p || !v?.ok || !!blocked} reason={!p ? 'Pick the item' : blocked || v?.errors[0]} style={{ marginTop: 10 }} onPress={publish} />
    <Button kind="ghost" title="← Back" style={{ marginTop: 6 }} onPress={onBack} />
  </Card>;
}
function Handover({ c, now }: { c: DealClaim; now: number }) {
  const [code, setCode] = useState(''); const [via, setVia] = useState<'cash' | 'upi'>('upi'); const [err, setErr] = useState('');
  if (c.fulfil === 'delivery') return <Card style={{ marginBottom: 8 }}><Kv k={`🛵 ${c.item} × ${c.qty} · ${c.customer}`} v={c.rider ? 'rider ' + c.rider : 'awaiting rider'} /><Text style={{ fontFamily: F.body, color: K.muted }}>Pack it — the batched run picks up at {DEALS.runs.join(' / ')}.</Text></Card>;
  return <Card testID={'vc-' + c.id} style={{ marginBottom: 8 }}><Kv k={`${c.item} × ${c.qty} · ${c.customer}`} v={rs(c.total)} /><Text style={{ fontFamily: F.body, color: K.muted }}>Collect before {fmtTime(c.expiresAtMs)}</Text>
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}><View style={{ flex: 1 }}><Field label="Pickup code" value={code} onChangeText={setCode} testID="vc-code" keyboardType="number-pad" maxLength={4} /></View></View>
    <View style={{ marginTop: 6 }}><Segmented value={via} onChange={setVia} options={[['upi', '📱 UPI'], ['cash', '💵 Cash']] as const} /></View>
    {!!err && <Text style={{ color: K.red, fontFamily: F.bold }}>{err}</Text>}
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><Button testID="vc-handover" kind="green" title="Handed over" style={{ flex: 2 }} disabled={code.length !== 4} onPress={() => api.models.claimHandover(c.id, code, 'picked_up', via).catch(() => setErr('Wrong code — ask the customer to show the code in their app.'))} />
      {now > c.expiresAtMs && <Button kind="ghost" title="No-show" style={{ flex: 1 }} onPress={() => api.models.claimNoShow(c.id).catch(e => setErr(e.message))} />}</View></Card>;
}
