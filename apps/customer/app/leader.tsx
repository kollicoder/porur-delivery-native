/** Community leader: who's in, pick list at the gate, hand-over + collection, 5% of delivered sales. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Share } from 'react-native';
import { Community, Meter as MeterT, MeterOrder, Drop, leaderEarnings, shareText, joinLink, rs, METER, fmtDay } from '@porur/shared';
import { K, F, Button, Card, Banner, Empty, SkeletonList, Pill } from '@porur/shared/src/ui/kit';
import { Title, Meter, Kv, CodeBox } from '@porur/shared/src/ui/kit2';
import { api, useApp } from '../src/store';

export default function Leader() {
  const { me } = useApp(); const cid = me?.communityId || '';
  const [comm, setComm] = useState<Community | null>(null); const [meters, setMeters] = useState<MeterT[]>([]); const [orders, setOrders] = useState<MeterOrder[] | null>(null); const [drops, setDrops] = useState<Drop[]>([]); const [err, setErr] = useState('');
  useEffect(() => { if (!cid) return; const m = api.models; const subs = [m.watchCommunities(c => setComm(c.find(x => x.id === cid) || null)), m.watchMeters('porur-west', setMeters), m.watchCommunityBaskets(cid, o => setOrders(o)), m.watchDropsFor('communityId', cid, setDrops)]; return () => subs.forEach(f => f()); }, [cid]);
  if (me?.role !== 'leader' || !cid) return <Empty testID="leader-none" emoji="👑" title="Leader dashboard" body="Community leaders are appointed by Porur. Ask support if you'd like to run the group buy for your apartment (5% of delivered sales)." />;
  if (!orders) return <ScrollView contentContainerStyle={{ padding: 16 }}><SkeletonList n={5} testID="leader-loading" /></ScrollView>;
  const meter = meters.find(m => m.status === 'open') || meters[0]; const live = orders.filter(o => o.status !== 'cancelled');
  const thisWeek = live.filter(o => o.meterId === meter?.id); const earn = leaderEarnings(live); const weekEarn = leaderEarnings(thisWeek); const drop = drops.find(d => d.status !== 'delivered');
  const act = (o: MeterOrder, v: 'cash' | 'upi' | 'missed') => api.models.markHanded(o, v).catch((e: any) => setErr(e.message));
  return <ScrollView testID="leader-screen" contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
    <Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink }}>👑 {comm?.name || cid}</Text><Text style={{ fontFamily: F.ta, color: K.muted }}>குடியிருப்பு தலைவர் · gate: {comm?.gate}</Text>
    {meter && <Card style={{ marginTop: 12 }}><Meter count={meter.count} threshold={meter.threshold} testID="leader-meter" /><Text style={{ fontFamily: F.body, color: K.muted, marginTop: 6 }}>Cluster-wide meter · {thisWeek.length} from your community this week</Text>
      <Button testID="leader-share" kind="primary" title="📣 Share join link" style={{ marginTop: 10 }} onPress={() => Share.share({ message: shareText(meter, joinLink(cid)) })} /></Card>}
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
      <Card style={{ flex: 1 }} testID="leader-earn-week"><Text style={{ fontFamily: F.bold, color: K.muted, fontSize: 12 }}>This week (5%)</Text><Text style={{ fontFamily: F.display, fontSize: 22, color: K.green }}>{rs(weekEarn.commission)}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{weekEarn.delivered} handed · {rs(weekEarn.sales)}</Text></Card>
      <Card style={{ flex: 1 }} testID="leader-earn-all"><Text style={{ fontFamily: F.bold, color: K.muted, fontSize: 12 }}>All time</Text><Text style={{ fontFamily: F.display, fontSize: 22, color: K.ink }}>{rs(earn.commission)}</Text><Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted }}>{earn.delivered} baskets · paid monthly</Text></Card>
    </View>
    {drop && <><Title en="Gate drop" ta="வாசல் டெலிவரி" /><Card testID="leader-drop"><Kv k={`${drop.title}`} v={drop.status.replace('_', ' ')} /><Kv k="Slot" v={drop.slot} /><DropCode id={drop.id} /></Card></>}
    {!!err && <Banner tone="error" title={err} />}
    <Title en={`Households (${thisWeek.length})`} ta="வீடுகள்" />
    {thisWeek.length === 0 ? <Empty emoji="🏠" title="No baskets yet this week" body="Share the join link on your apartment WhatsApp group." /> : thisWeek.sort((a, b) => a.flat.localeCompare(b.flat)).map(o =>
      <Card key={o.id} testID={'lb-' + o.id} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: F.display, fontSize: 17, color: K.ink }}>{o.flat} · {o.customer}</Text><Pill label={o.handoverStatus === 'handed' ? `✓ ${o.collectedVia}` : o.handoverStatus === 'missed' ? 'Missed' : o.status} /></View>
        <Text style={{ fontFamily: F.body, color: K.ink2, fontSize: 13 }}>{o.lines.map(l => `${l.name} ${l.qty}${l.unit}`).join(' · ')}</Text>
        <Kv bold k={o.amountDue != null ? 'Collect' : 'Max (Sunday)'} v={rs(o.amountDue ?? o.sundayTotal)} />
        {o.status === 'locked' && o.handoverStatus === 'pending' && <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <Button testID={'hand-cash-' + o.id} kind="green" title="💵 Cash" style={{ flex: 1 }} onPress={() => act(o, 'cash')} /><Button testID={'hand-upi-' + o.id} kind="dark" title="📱 UPI" style={{ flex: 1 }} onPress={() => act(o, 'upi')} /><Button kind="ghost" title="Missed" style={{ flex: 1 }} onPress={() => act(o, 'missed')} /></View>}
      </Card>)}
    <Text style={{ fontFamily: F.body, fontSize: 12, color: K.muted, marginTop: 10 }}>Commission = {METER.leaderPct}% of baskets you hand over (final price). Next payout: {fmtDay(Date.now() + 7 * 864e5)}.</Text>
  </ScrollView>;
}
function DropCode({ id }: { id: string }) { const [c, setC] = useState<string | null>(null); useEffect(() => api.models.watchDropCode(id, setC), [id]); return <CodeBox label="Give this code to the rider when the crates arrive" code={c} testID="leader-drop-code" />; }
