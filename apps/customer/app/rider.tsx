import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { errandPrice, buildErrand, rs } from '@porur/shared';
import { s, C } from '../src/theme';
import { K, F, Segmented, Stepper, Card } from '@porur/shared/src/ui/kit';
import { Btn } from '../src/ui';
import { api, useApp } from '../src/store';
const Step = ({ v, set, min, max, unit }: { v: number; set: (n: number) => void; min: number; max: number; unit: string }) =>
  <Stepper testID={'step-' + unit} dark={false} value={v} unit={unit} onChange={n => set(Math.min(max, Math.max(min, n)))} />;
export default function Rider() {
  const { settings, uid, who, pushToken, riders } = useApp(); const [pay, setPay] = useState<'COD' | 'UPI_DOD'>('COD');
  const [mode, setMode] = useState<'trip' | 'hour'>('trip'); const [pickup, setPickup] = useState('Saravana Stores, Porur Junction');
  const [drop, setDrop] = useState('Flat 2A, Sri Sai Apartments, Porur'); const [task, setTask] = useState('Pick up a parcel and hand it over at home');
  const [km, setKm] = useState(3); const [hours, setHours] = useState(1); const price = errandPrice(mode, km, hours, settings);
  const book = async () => { const e = buildErrand({ pickup, drop, task, price, ...who, customerUid: uid, dropLat: 13.0482, dropLng: 80.1685, customerPushToken: pushToken, pay }); await api.createOrders([e], { riders }); router.replace(`/order/${e.id}`); };
  return <ScrollView style={s.page} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
    <Text style={{ fontFamily: F.ta, color: K.muted }}>ரைடர் புக் செய்யுங்கள்</Text>
    <Text style={[s.muted, { marginTop: 4, marginBottom: 12, fontSize: 14 }]}>Anything, anywhere in Porur — pick up, drop, buy & bring, stand in a queue.</Text>
    <Segmented value={mode} onChange={setMode} options={[['trip', 'Per trip'], ['hour', 'Hire by hour']] as const} />
    <Card style={{ marginTop: 12 }}>
      <Text style={[s.label, { marginTop: 0 }]}>🟢 Pickup</Text><TextInput testID="pickup" style={s.input} value={pickup} onChangeText={setPickup} />
      <Text style={s.label}>🔴 Drop</Text><TextInput testID="drop" style={s.input} value={drop} onChangeText={setDrop} />
      <Text style={s.label}>What should the rider do?</Text><TextInput testID="task" style={[s.input, { minHeight: 64 }]} multiline value={task} onChangeText={setTask} />
    </Card>
    <View style={[s.row, { marginTop: 8 }]}><Text style={s.label}>{mode === 'trip' ? 'Estimated distance' : 'Hours'}</Text>
      {mode === 'trip' ? <Step v={km} set={setKm} min={1} max={8} unit="km" /> : <Step v={hours} set={setHours} min={1} max={6} unit="hr" />}</View>
    <View style={{ backgroundColor: K.yellow, borderRadius: 22, padding: 16, marginTop: 10 }}>
      <View style={s.row}><Text style={{ fontFamily: F.bold, color: K.ink, fontSize: 15 }}>Estimated price</Text><Text style={{ fontFamily: F.display, fontSize: 26, color: K.ink }}>{rs(price)}</Text></View>
      <Text style={{ fontFamily: F.body, color: K.ink, fontSize: 13 }}>{mode === 'trip' ? `${rs(settings.errandBase)} for first 3 km, ${rs(settings.errandPerKm)} per extra km` : `${rs(settings.errandHour)} per hour`} · item cost (if buying) paid separately</Text></View>
    <Text style={s.label}>Pay on delivery</Text>
    <Segmented value={pay} onChange={setPay} options={[['COD', '💵 Cash'], ['UPI_DOD', '📱 UPI']] as const} />
    <Text style={[s.muted, { fontSize: 12, marginTop: 8 }]}>We assign the nearest available rider automatically.</Text>
    <Btn testID="book" title={`Book rider · ${rs(price)}`} onPress={book} />
  </ScrollView>;
}
