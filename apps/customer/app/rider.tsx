import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { errandPrice, buildErrand, rs } from '@porur/shared';
import { s, C } from '../src/theme';
import { Btn } from '../src/ui';
import { api, ME, useApp } from '../src/store';
const Step = ({ v, set, min, max, unit }: { v: number; set: (n: number) => void; min: number; max: number; unit: string }) =>
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <Pressable style={s.chip} onPress={() => set(Math.max(min, v - 0.5 * (unit === 'km' ? 1 : 2)))}><Text style={{ fontSize: 18 }}>−</Text></Pressable>
    <Text style={{ fontWeight: '800', fontSize: 18 }}>{v} {unit}</Text>
    <Pressable style={s.chip} onPress={() => set(Math.min(max, v + 0.5 * (unit === 'km' ? 1 : 2)))}><Text style={{ fontSize: 18 }}>+</Text></Pressable></View>;
export default function Rider() {
  const { settings, uid } = useApp();
  const [mode, setMode] = useState<'trip' | 'hour'>('trip'); const [pickup, setPickup] = useState('Saravana Stores, Porur Junction');
  const [drop, setDrop] = useState('Flat 2A, Sri Sai Apartments, Porur'); const [task, setTask] = useState('Pick up a parcel and hand it over at home');
  const [km, setKm] = useState(3); const [hours, setHours] = useState(1); const price = errandPrice(mode, km, hours, settings);
  const book = async () => { const e = buildErrand({ pickup, drop, task, price, ...ME, customerUid: uid }); await api.createOrders([e]); router.replace(`/order/${e.id}`); };
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Text style={s.muted}>Anything, anywhere in Porur — pick up, drop, buy & bring, stand in a queue.</Text>
    <View style={{ flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginTop: 10 }}>
      {([['trip', 'Per trip'], ['hour', 'Hire by hour']] as const).map(([k, n]) => <Pressable key={k} onPress={() => setMode(k)} style={{ flex: 1, padding: 9, borderRadius: 9, alignItems: 'center', backgroundColor: mode === k ? '#fff' : 'transparent' }}><Text style={{ fontWeight: '700' }}>{n}</Text></Pressable>)}
    </View>
    <Text style={s.label}>🟢 Pickup</Text><TextInput style={s.input} value={pickup} onChangeText={setPickup} />
    <Text style={s.label}>🔴 Drop</Text><TextInput style={s.input} value={drop} onChangeText={setDrop} />
    <Text style={s.label}>What should the rider do?</Text><TextInput style={s.input} multiline value={task} onChangeText={setTask} />
    <Text style={s.label}>{mode === 'trip' ? 'Estimated distance' : 'Hours'}</Text>
    {mode === 'trip' ? <Step v={km} set={setKm} min={1} max={8} unit="km" /> : <Step v={hours} set={setHours} min={1} max={6} unit="hr" />}
    <View style={s.card}><View style={s.row}><Text style={{ fontWeight: '800', fontSize: 16 }}>Estimated price</Text><Text style={{ fontWeight: '800', fontSize: 18, color: C.green }}>{rs(price)}</Text></View>
      <Text style={s.muted}>{mode === 'trip' ? `${rs(settings.errandBase)} for first 3 km, ${rs(settings.errandPerKm)} per extra km` : `${rs(settings.errandHour)} per hour`} · item cost (if buying) paid separately</Text></View>
    <Btn testID="book" title={`Book rider · ${rs(price)}`} onPress={book} />
  </ScrollView>;
}
