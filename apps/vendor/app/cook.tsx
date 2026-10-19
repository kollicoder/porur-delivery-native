/** Home-cook dashboard: post tomorrow's menu (₹130–150), see next-day team orders by office, hygiene checklist before "ready". */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cook, MealMenu, LunchOrder, LUNCH, HYGIENE_ITEMS, OFFICES, nextLunchDate, istDate, fmtDay, fmtLeft, lunchCutoffMs, priceOk, rs } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Pill, TAP } from '@porur/shared/src/ui/kit';
import { Title, Field, Kv, useNow } from '@porur/shared/src/ui/kit2';
import { api, useVendor } from '../src/store';
const dayMs = (d: string) => Date.parse(d + 'T06:30:00Z');
const NEXT: Record<string, LunchOrder['status']> = { placed: 'confirmed', confirmed: 'cooking', cooking: 'ready' };

export default function CookHome() {
  const { me, ready } = useVendor(); const now = useNow(60000); const cookId = me?.role === 'cook' ? me.cookId : undefined;
  const [cook, setCook] = useState<Cook | null>(null); const [menus, setMenus] = useState<MealMenu[] | null>(null); const [orders, setOrders] = useState<LunchOrder[]>([]); const [err, setErr] = useState('');
  useEffect(() => { if (!cookId) return; const m = api.models; const subs = [m.watchCooks(c => setCook(c.find(x => x.id === cookId) || null)), m.watchCookMenus(cookId, setMenus), m.watchCookOrders(cookId, setOrders)]; return () => subs.forEach(f => f()); }, [cookId]);
  if (ready && !cookId) return <Redirect href="/" />;
  if (!menus || !cook) return <SafeAreaView style={{ flex: 1, backgroundColor: K.bg, padding: 16 }}><SkeletonList n={4} testID="cook-loading" /></SafeAreaView>;
  const next = nextLunchDate(now), today = istDate(now); const live = orders.filter(o => o.status !== 'cancelled');
  const dates = [...new Set([today, next, ...live.map(o => o.date)])].filter(d => d >= today).sort().slice(0, 3);
  return <SafeAreaView style={{ flex: 1, backgroundColor: K.bg }} edges={['top']}><ScrollView testID="cook-home" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View style={{ flex: 1 }}><Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink }}>👩‍🍳 {cook.kitchen}</Text>
      <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{cook.name} · FSSAI {cook.fssaiNo} · ★ {cook.rating || 'new'}</Text></View>
      <Pressable testID="signout" onPress={() => api.logout()} style={{ minHeight: TAP, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ fontFamily: F.bold, textDecorationLine: 'underline', color: K.ink }}>Sign out</Text></Pressable></View>
    {cook.status === 'paused' && <Banner tone="warn" title="Your kitchen is paused by Porur" body="Customers can't order until the team re-activates it." />}
    <MenuEditor cook={cook} date={next} menu={menus.find(m => m.date === next)} now={now} />
    {!!err && <Banner tone="error" title={err} testID="cook-error" />}
    {dates.map(d => { const os = live.filter(o => o.date === d); const menu = menus.find(m => m.date === d); const vegN = os.reduce((a, o) => a + o.vegPacks, 0), nvN = os.reduce((a, o) => a + o.nonVegPacks, 0);
      return <View key={d}><Title en={`${d === today ? 'Today' : fmtDay(dayMs(d))} · ${os.length} orders`} ta={`${vegN} veg · ${nvN} non-veg · deliver ${LUNCH.slot}`} />
        {menu && d === today && <Checklist menu={menu} />}
        {os.length === 0 ? <Text style={{ fontFamily: F.body, color: K.muted }}>No orders yet.</Text> : OFFICES.filter(off => os.some(o => o.officeId === off.id)).map(off => <Card key={off.id} style={{ marginBottom: 8 }} testID={`cook-office-${off.id}`}>
          <Text style={{ fontFamily: F.display, fontSize: 16, color: K.ink }}>{off.short}</Text>
          {os.filter(o => o.officeId === off.id).map(o => <View key={o.id} testID={'co-' + o.id} style={{ borderTopWidth: 1, borderTopColor: K.line, paddingTop: 6, marginTop: 6 }}>
            <Kv k={`${o.company}${o.floor ? ' · ' + o.floor : ''}`} v={o.status} /><Text style={{ fontFamily: F.body, color: K.ink2, fontSize: 13 }}>🟢 {o.vegPacks} · 🔴 {o.nonVegPacks} · {rs(o.total)}</Text>
            {NEXT[o.status] && <Button testID={'cook-next-' + o.id} kind={NEXT[o.status] === 'ready' ? 'green' : 'dark'} title={`Mark ${NEXT[o.status]}`} style={{ marginTop: 6 }}
              disabled={NEXT[o.status] === 'ready' && !menus.find(m => m.id === o.menuId)?.checklistDone} reason={NEXT[o.status] === 'ready' && !menus.find(m => m.id === o.menuId)?.checklistDone ? 'Finish the hygiene checklist first' : undefined}
              onPress={() => { setErr(''); api.models.setLunchStatus(o.id, NEXT[o.status]).catch(e => setErr(e.message)); }} />}
          </View>)}</Card>)}
      </View>; })}
  </ScrollView></SafeAreaView>;
}
function MenuEditor({ cook, date, menu, now }: { cook: Cook; date: string; menu?: MealMenu; now: number }) {
  const [vegDish, setVegDish] = useState(menu?.vegDish || 'Sambar rice, poriyal, curd rice'); const [vegPrice, setVegPrice] = useState(String(menu?.vegPrice || 130));
  const [nvDish, setNvDish] = useState(menu?.nonVegDish || (cook.nonVeg ? 'Chicken curry meals' : '')); const [nvPrice, setNvPrice] = useState(String(menu?.nonVegPrice || (cook.nonVeg ? 150 : '')));
  const [cap, setCap] = useState(String(menu?.capacity || cook.capacity || 20)); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (menu) { setVegDish(menu.vegDish); setVegPrice(String(menu.vegPrice)); setNvDish(menu.nonVegDish || ''); setNvPrice(menu.nonVegPrice ? String(menu.nonVegPrice) : ''); setCap(String(menu.capacity)); } }, [menu?.id]);
  const vp = Number(vegPrice), np = nvDish.trim() ? Number(nvPrice) : undefined; const bad = !priceOk(vp) || (np != null && !priceOk(np)) ? `Price must be ₹${LUNCH.minPrice}–${LUNCH.maxPrice} per pack.` : '';
  const closed = now >= lunchCutoffMs(date);
  return <Card style={{ marginTop: 12, borderWidth: 2, borderColor: K.ink }} testID="menu-editor">
    <Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>Menu for {fmtDay(dayMs(date))}</Text>
    <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{menu ? `${menu.booked} / ${menu.capacity} packs booked · ` : ''}orders close in {fmtLeft(lunchCutoffMs(date) - now)}</Text>
    <Field label="🟢 Veg meal" value={vegDish} onChangeText={setVegDish} testID="menu-veg" /><Field label="Veg price (₹)" value={vegPrice} onChangeText={setVegPrice} testID="menu-veg-price" keyboardType="number-pad" maxLength={3} />
    <Field label="🔴 Non-veg meal (optional)" value={nvDish} onChangeText={setNvDish} testID="menu-nv" />{!!nvDish.trim() && <Field label="Non-veg price (₹)" value={nvPrice} onChangeText={setNvPrice} testID="menu-nv-price" keyboardType="number-pad" maxLength={3} />}
    <Field label="Max packs" value={cap} onChangeText={setCap} testID="menu-cap" keyboardType="number-pad" maxLength={3} />
    {!!bad && <Text style={{ fontFamily: F.bold, color: K.orange, marginTop: 6 }}>{bad}</Text>}
    {!!msg && <Text testID="menu-msg" style={{ fontFamily: F.bold, color: msg.startsWith('Saved') ? K.green : K.red, marginTop: 6 }}>{msg}</Text>}
    <Button testID="menu-save" kind="primary" title={busy ? 'Saving…' : menu ? 'Update menu' : 'Publish menu'} disabled={busy || !!bad || closed || !vegDish.trim()} reason={closed ? 'Orders for this day are closed' : bad || undefined} style={{ marginTop: 10 }}
      onPress={async () => { setBusy(true); setMsg(''); try { await api.models.saveMenu(cook, date, { vegDish: vegDish.trim(), vegPrice: vp, ...(np != null ? { nonVegDish: nvDish.trim(), nonVegPrice: np } : {}), capacity: Math.max(1, Math.min(200, Math.round(Number(cap) || 20))) }); setMsg('Saved — customers can order now.'); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); } }} />
  </Card>;
}
function Checklist({ menu }: { menu: MealMenu }) {
  const [c, setC] = useState<Record<string, boolean>>(menu.checklist || {}); useEffect(() => setC(menu.checklist || {}), [menu.id]);
  const toggle = (k: string) => { const n = { ...c, [k]: !c[k] }; setC(n); api.models.saveChecklist(menu.id, n, HYGIENE_ITEMS.every(([x]) => n[x])).catch(() => {}); };
  return <Card testID="hygiene" style={{ marginBottom: 8, backgroundColor: menu.checklistDone ? K.greenSoft : K.yellowSoft }}>
    <Text style={{ fontFamily: F.display, fontSize: 16, color: K.ink }}>{menu.checklistDone ? '✅ Hygiene checklist done' : '🧼 Before you cook — hygiene checklist'}</Text>
    {HYGIENE_ITEMS.map(([k, l]) => <Pressable key={k} testID={'hyg-' + k} accessibilityRole="checkbox" accessibilityState={{ checked: !!c[k] }} onPress={() => toggle(k)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: TAP }}>
      <Text style={{ fontSize: 22, color: c[k] ? K.green : K.muted }}>{c[k] ? '☑' : '☐'}</Text><Text style={{ fontFamily: F.body, color: K.ink, flex: 1 }}>{l}</Text></Pressable>)}
  </Card>;
}
