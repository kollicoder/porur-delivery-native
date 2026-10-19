/** Group-buy "Meter": weekly list, ₹300 basket committed at the Sunday price, pay on delivery; price drops if the meter fills. */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Share, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Community, Meter as MeterT, MeterOrder, WeeklyList, WalletEntry, Drop, METER, SAMPLE_BASKET, basketTotals, meterForecast, fmtLeft, fmtDay, fmtTime, shareText, joinLink, walletBalance, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Stepper, Segmented, Pill, TAP } from '@porur/shared/src/ui/kit';
import { Title, Meter, Chip, Field, Kv, CodeBox, useNow } from '@porur/shared/src/ui/kit2';
import { api, useApp } from '../src/store';

export default function MeterScreen() {
  const { me, t } = useApp(); const params = useLocalSearchParams<{ c?: string }>(); const now = useNow(30000);
  const [comms, setComms] = useState<Community[] | null>(null); const [meters, setMeters] = useState<MeterT[] | null>(null); const [list, setList] = useState<WeeklyList | null>(null);
  const [mine, setMine] = useState<MeterOrder[]>([]); const [wallet, setWallet] = useState<WalletEntry[]>([]); const [drops, setDrops] = useState<Drop[]>([]);
  const [cid, setCid] = useState<string>(''); const [flat, setFlat] = useState(me?.flat || ''); const [sel, setSel] = useState<Record<string, number>>({}); const [pay, setPay] = useState<'COD' | 'UPI_DOD'>('COD');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => { AsyncStorage.getItem('porur.community').then(c => setCid(params.c || me?.communityId || c || '')); }, [params.c, me?.communityId]);
  useEffect(() => { const m = api.models; const subs = [m.watchCommunities(setComms), m.watchMeters('porur-west', setMeters), m.watchMyBaskets(setMine), m.watchWallet(setWallet)]; return () => subs.forEach(f => f()); }, []);
  const meter = meters?.find(x => x.status === 'open') || meters?.[0];
  useEffect(() => { if (meter?.listId) return api.models.watchList(meter.listId, setList); }, [meter?.listId]);
  useEffect(() => { const u = api.uid(); if (u) return api.models.watchDropsFor('uids', u, setDrops); }, []);
  const community = comms?.find(c => c.id === cid); const tot = useMemo(() => basketTotals(Object.entries(sel).map(([skuId, qty]) => ({ skuId, qty })), list?.skus || []), [sel, list]);
  const current = mine.find(o => o.meterId === meter?.id && o.status !== 'cancelled'); const fc = meter ? meterForecast(meter, now) : null; const bal = walletBalance(wallet);
  const open = meter?.status === 'open' && now < (meter?.cutoffMs || 0);
  if (!comms || !meters) return <ScrollView contentContainerStyle={{ padding: 16 }}><SkeletonList n={5} testID="meter-loading" /></ScrollView>;
  if (!meter) return <Empty testID="meter-empty" emoji="🧺" title="No group buy open right now" body="A new weekly meter opens every Sunday. Check back soon." action="Back home" onAction={() => router.back()} />;
  const commit = async () => { setErr(''); setOk(''); if (!community) return setErr('Pick your apartment / community first.'); if (!flat.trim()) return setErr('Add your flat / door number so the leader can hand it over.');
    setBusy(true); try { await AsyncStorage.setItem('porur.community', community.id); if (flat !== me?.flat) api.updateMe({ flat } as any).catch(() => {});
      await api.models.commitBasket(meter, list!, community, flat.trim(), sel, pay); setSel({}); setOk('Basket committed! You pay on delivery — never more than the Sunday price.'); } catch (e: any) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  return <ScrollView testID="meter-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View testID="meter-hero" style={{ backgroundColor: K.ink, borderRadius: 26, padding: 18 }}>
      <Text style={{ fontFamily: F.bold, color: K.yellow, fontSize: 13 }}>🧺 {meter.clusterName.toUpperCase()} · WEEK OF {fmtDay(meter.cutoffMs).toUpperCase()}</Text>
      <Text style={{ fontFamily: F.display, color: '#fff', fontSize: 26, marginTop: 4, lineHeight: 29 }}>{fc!.left > 0 ? `${fc!.left} more baskets to unlock the lower price` : 'Meter full — lower price unlocked!'}</Text>
      <Text style={{ fontFamily: F.ta, color: '#E9E4D8', fontSize: 12, marginBottom: 12 }}>100 கூடைகள் சேர்ந்தால் விலை குறையும்</Text>
      <Meter dark count={meter.count} threshold={meter.threshold} testID="meter-bar" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#2A2822', borderRadius: 16, padding: 10 }}><Text style={{ fontFamily: F.bold, color: '#E9E4D8', fontSize: 12 }}>Closes in</Text>
          <Text testID="meter-countdown" style={{ fontFamily: F.display, color: '#fff', fontSize: 18 }}>{open ? fmtLeft(meter.cutoffMs - now) : 'closed'}</Text><Text style={{ fontFamily: F.body, color: '#E9E4D8', fontSize: 11 }}>Sat 9 pm cutoff</Text></View>
        <View style={{ flex: 1, backgroundColor: '#2A2822', borderRadius: 16, padding: 10 }}><Text style={{ fontFamily: F.bold, color: '#E9E4D8', fontSize: 12 }}>Expected delivery</Text>
          <Text testID="meter-eta" style={{ fontFamily: F.display, color: '#fff', fontSize: 18 }}>{fmtDay(fc!.deliveryMs)}</Text><Text style={{ fontFamily: F.body, color: '#E9E4D8', fontSize: 11 }}>{fc!.fillMs ? METER.fillSlot : '9–11 am'} at your gate</Text></View>
      </View>
      <Text testID="meter-forecast" style={{ fontFamily: F.body, color: '#E9E4D8', fontSize: 13, marginTop: 10 }}>{fc!.text}</Text>
      <Button testID="meter-share" kind="primary" title="📣  Share with neighbours (WhatsApp)" style={{ marginTop: 12 }} onPress={() => Share.share({ message: shareText(meter, joinLink(cid || undefined)) })} />
    </View>
    <Title en="How the price works" ta="விலை எப்படி?" />
    <Card testID="meter-tiers"><Kv k="🟡 Meter fills (100 baskets)" v="Fill price · 7–9 am next day" /><Kv k="⚪ Doesn't fill by Sat 9 pm" v="Sunday price · Sun 9–11 am" />
      <Text style={{ fontFamily: F.body, fontSize: 13, color: K.muted, marginTop: 6 }}>You commit at the Sunday price — that's the most you'll ever pay. Pay cash or UPI to your community leader when it arrives. If it fills, you simply pay the lower price. Line refunds (short or bad items) go to your Porur wallet and come off your next basket.</Text></Card>
    {bal > 0 && <Banner tone="ok" icon="👛" title={`Wallet: ${rs(bal)} credit`} body="Applied automatically to your next group-buy basket." testID="meter-wallet" />}
    {current ? <MyBasket o={current} drops={drops} open={open} /> : !open ? <Banner tone="warn" title="This week's meter is closed" body="The next meter opens shortly — you can commit then." testID="meter-closed" /> : <>
      <Title en="1. Your community" ta="உங்கள் குடியிருப்பு" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{comms.map(c => <Chip key={c.id} testID={'comm-' + c.id} label={c.name} on={c.id === cid} onPress={() => setCid(c.id)} />)}</View>
      {community && <Text style={{ fontFamily: F.body, color: K.muted, fontSize: 13 }}>Gate drop at {community.gate}{community.leaderName ? ` · leader ${community.leaderName}` : ' · leader to be confirmed'}</Text>}
      <Field label="Flat / door no." value={flat} onChangeText={setFlat} testID="meter-flat" placeholder="e.g. B-204" maxLength={20} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}><Title en="2. This week's list" ta="இந்த வார பட்டியல்" />
        <Pressable testID="meter-sample" onPress={() => setSel(SAMPLE_BASKET)} style={{ minHeight: TAP, justifyContent: 'center' }}><Text style={{ fontFamily: F.bold, color: K.blue }}>Use a sample basket</Text></Pressable></View>
      {!list ? <SkeletonList n={4} /> : list.skus.map(k => { const q = sel[k.id] || 0; return <View key={k.id} testID={'sku-' + k.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: K.card, borderRadius: 18, padding: 10, marginVertical: 4, borderWidth: 1, borderColor: q ? K.ink : K.line }}>
        <Text style={{ fontSize: 28, width: 36, textAlign: 'center' }}>{k.emoji}</Text>
        <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: K.ink }}>{k.name}</Text><Text style={{ fontFamily: F.ta, fontSize: 12, color: K.muted }}>{k.ta}</Text>
          <Text style={{ fontFamily: F.body, fontSize: 12, color: K.ink2 }}>₹{k.sundayPrice} → <Text style={{ fontFamily: F.bold, color: K.green }}>₹{k.fillPrice}</Text> / {k.unit}{k.refPrice ? <Text style={{ color: K.muted }}>  · mkt ₹{k.refPrice}</Text> : null}</Text></View>
        {q ? <Stepper testID={'mq-' + k.id} value={q} onChange={n => setSel(s => { const x = { ...s }; if (n <= 0) delete x[k.id]; else x[k.id] = Math.min(k.maxPerHousehold, Math.round(n / k.step) * k.step || k.step); return x; })} />
          : <Pressable testID={'madd-' + k.id} accessibilityLabel={'Add ' + k.name} onPress={() => setSel(s => ({ ...s, [k.id]: k.step }))} style={{ width: TAP, height: TAP, borderRadius: 24, backgroundColor: K.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 24, fontFamily: F.bold }}>+</Text></Pressable>}
      </View>; })}
      <Title en="3. Pay on delivery" ta="டெலிவரியில் பணம்" />
      <Segmented value={pay} onChange={setPay} options={[['COD', '💵 Cash'], ['UPI_DOD', '📱 UPI at the gate']] as const} />
      <Card style={{ marginTop: 12 }} testID="meter-summary"><Kv k="Sunday price (max)" v={rs(tot.sundayTotal)} /><Kv k="If the meter fills" v={rs(tot.fillTotal)} /><Kv k="You'd save" v={rs(tot.saving)} />
        {!tot.ok && <Text testID="meter-short" style={{ fontFamily: F.bold, color: K.orange, marginTop: 6 }}>Add {rs(tot.short)} more — minimum basket is ₹{METER.minBasket}.</Text>}</Card>
      {!!err && <Banner tone="error" title={err} testID="meter-error" />}
      <Button testID="meter-commit" kind="primary" title={busy ? 'Committing…' : `Commit basket · max ${rs(tot.sundayTotal)}`} disabled={busy || !tot.ok || !community || !flat.trim()}
        reason={!tot.ok ? `Minimum basket ₹${METER.minBasket}` : !community ? 'Pick your community' : !flat.trim() ? 'Add your flat number' : undefined} onPress={commit} style={{ marginTop: 12 }} />
    </>}
    {!!ok && <Banner tone="ok" icon="✅" title={ok} testID="meter-ok" />}
    <Title en="Past baskets" ta="முந்தைய கூடைகள்" />
    {mine.filter(o => o.id !== current?.id).length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>Nothing yet.</Text> : mine.filter(o => o.id !== current?.id).map(o =>
      <Card key={o.id} style={{ marginBottom: 8 }} testID={'basket-' + o.id}><Kv k={`${o.id} · ${o.lines.length} items`} v={o.status} /><Kv k={o.finalTier ? `Final (${o.finalTier} price)` : 'Sunday price'} v={rs(o.amountDue ?? o.finalAmount ?? o.sundayTotal)} /></Card>)}
    {me?.role === 'leader' && <Button testID="open-leader" kind="dark" title="👑  Open leader dashboard" style={{ marginTop: 14 }} onPress={() => router.push('/leader')} />}
    {wallet.length > 0 && <><Title en="Wallet" ta="வாலட்" />{wallet.map(w => <Kv key={w.id} k={`${w.reason} · ${w.createdAt.slice(0, 10)}`} v={(w.amount > 0 ? '+' : '') + rs(w.amount)} />)}</>}
  </ScrollView>;
}
function MyBasket({ o, drops, open }: { o: MeterOrder; drops: Drop[]; open: boolean }) {
  const [code, setCode] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const drop = drops.find(d => d.id === o.dropId);
  useEffect(() => { if (o.dropId) return api.models.watchDropCode(o.dropId, setCode); }, [o.dropId]);
  return <Card testID="my-basket" style={{ marginTop: 14, borderWidth: 2, borderColor: K.ink }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>Your basket · {o.flat}</Text>
      <Pill label={o.status === 'committed' ? 'Committed' : o.handoverStatus === 'handed' ? 'Handed over' : o.status === 'locked' ? 'Packing' : o.status} bg={o.status === 'committed' ? K.yellowSoft : K.greenSoft} /></View>
    {o.lines.map(l => <Kv key={l.skuId} k={`${l.emoji || ''} ${l.name} × ${l.qty} ${l.unit}`} v={rs(Math.round(l.sundayPrice * l.qty))} />)}
    <View style={{ height: 1, backgroundColor: K.line, marginVertical: 6 }} />
    {o.finalTier ? <><Kv k={`Final price (${o.finalTier === 'fill' ? 'meter filled' : 'Sunday'})`} v={rs(o.finalAmount!)} />{!!o.walletApplied && <Kv k="Wallet credit applied" v={'−' + rs(o.walletApplied)} />}<Kv bold k="Pay at delivery" v={rs(o.amountDue ?? o.finalAmount!)} testID="basket-due" />
      {!!o.refundDue && <Text style={{ fontFamily: F.body, color: K.green }}>You save {rs(o.refundDue)} — not charged.</Text>}</>
      : <><Kv bold k="Max you pay (Sunday price)" v={rs(o.sundayTotal)} testID="basket-max" /><Kv k="If the meter fills" v={rs(o.fillTotal)} /></>}
    {drop && <><Text style={{ fontFamily: F.bold, color: K.ink, marginTop: 8 }}>🚚 Gate drop: {drop.status.replace('_', ' ')} · {drop.slot}</Text>{code && drop.status !== 'delivered' && <CodeBox label="Drop code for the rider (leader shares it at the gate)" code={code} testID="drop-code" />}</>}
    {!!err && <Banner tone="error" title={err} />}
    {o.status === 'committed' && open && <Button testID="basket-cancel" kind="ghost" title={busy ? 'Cancelling…' : 'Cancel basket (free until Sat 9 pm)'} style={{ marginTop: 10 }} onPress={async () => { setBusy(true); setErr(''); try { await api.models.cancelBasket(o); } catch (e: any) { setErr(e.message); } finally { setBusy(false); } }} />}
  </Card>;
}
