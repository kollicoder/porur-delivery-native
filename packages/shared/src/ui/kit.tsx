/** ding-dong design system (v0.5). Cream canvas, ink text, yellow primary, pastel category tiles. All text pairs meet WCAG AA (≥4.5:1). */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, ViewStyle, TextStyle, Platform, StyleProp } from 'react-native';

export const K = {
  bg: '#F6F3EC', card: '#FFFFFF', ink: '#15140F', ink2: '#33302A', muted: '#57554D', line: '#E9E4D8', soft: '#EFEBE1',
  yellow: '#FFC93C', yellowSoft: '#FFF1C7', green: '#1F7A3A', greenSoft: '#DDF3E1', orange: '#C2410C', orangeBright: '#F26A2E', orangeSoft: '#FFE6D6',
  red: '#B42318', redSoft: '#FDE4E1', blue: '#1D4ED8', blueSoft: '#E1EBFF', lilac: '#E6DEFF', pink: '#FFDDE3',
  disabledBg: '#E9E4D8', disabledFg: '#57554D', // 6.3:1
};
export const F = { display: 'BricolageGrotesque_800ExtraBold', body: 'PlusJakartaSans_500Medium', bold: 'PlusJakartaSans_700Bold', ta: 'NotoSansTamil_400Regular' };
export const TAP = 48;

type BtnKind = 'primary' | 'dark' | 'ghost' | 'danger' | 'green';
export function Button({ title, onPress, disabled, kind = 'dark', testID, style, reason, onLockedPress, icon }: {
  title: string; onPress?: () => void; disabled?: boolean; kind?: BtnKind; testID?: string; style?: StyleProp<ViewStyle>;
  /** shown prominently above a locked button; tapping the locked button calls onLockedPress (e.g. scroll to the missing step) */
  reason?: string; onLockedPress?: () => void; icon?: string;
}) {
  const bg = disabled ? K.disabledBg : { primary: K.yellow, dark: K.ink, ghost: 'transparent', danger: K.redSoft, green: K.green }[kind];
  const fg = disabled ? K.disabledFg : { primary: K.ink, dark: '#fff', ghost: K.ink, danger: K.red, green: '#fff' }[kind];
  return <View style={style}>
    {disabled && !!reason && <Pressable onPress={onLockedPress} accessibilityRole="button" testID={testID ? testID + '-reason' : undefined} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: K.orangeSoft, borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F5B48F' }}>
      <Text style={{ fontSize: 16 }}>⚠️</Text><Text style={{ flex: 1, color: '#7A2E0B', fontFamily: F.bold, fontSize: 14 }}>{reason}</Text></Pressable>}
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} accessibilityHint={disabled ? reason : undefined}
      onPress={disabled ? onLockedPress : onPress}
      style={({ pressed }) => ({ minHeight: 52, borderRadius: 999, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8,
        borderWidth: kind === 'ghost' ? 1.5 : 0, borderColor: K.ink, opacity: pressed ? 0.85 : 1 })}>
      {!!icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
      <Text style={{ color: fg, fontFamily: F.bold, fontSize: 16 }}>{title}</Text>
    </Pressable></View>;
}
export const Card = ({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) =>
  <View testID={testID} style={[{ backgroundColor: K.card, borderRadius: 20, padding: 14, marginVertical: 6, borderWidth: 1, borderColor: K.line }, style]}>{children}</View>;
export const H = ({ children, size = 26, style }: { children: React.ReactNode; size?: number; style?: StyleProp<TextStyle> }) =>
  <Text style={[{ fontFamily: F.display, fontSize: size, color: K.ink, letterSpacing: -0.5, lineHeight: size * 1.12 }, style]}>{children}</Text>;
export const T = ({ children, style, b, muted, ta, size = 14, numberOfLines, testID }: { children: React.ReactNode; style?: StyleProp<TextStyle>; b?: boolean; muted?: boolean; ta?: boolean; size?: number; numberOfLines?: number; testID?: string }) =>
  <Text testID={testID} numberOfLines={numberOfLines} style={[{ fontFamily: ta ? F.ta : b ? F.bold : F.body, fontSize: size, color: muted ? K.muted : K.ink }, style]}>{children}</Text>;
export const Pill = ({ label, bg = K.soft, fg = K.ink, testID }: { label: string; bg?: string; fg?: string; testID?: string }) =>
  <View testID={testID} style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}><Text style={{ color: fg, fontFamily: F.bold, fontSize: 12 }}>{label}</Text></View>;

/** Quantity stepper — each control is a 48×48 target */
export function Stepper({ value, onChange, unit, testID, dark = true }: { value: number; onChange: (n: number) => void; unit?: string; testID?: string; dark?: boolean }) {
  const fg = dark ? '#fff' : K.ink;
  return <View testID={testID} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? K.ink : K.soft, borderRadius: 999, minHeight: TAP }}>
    <Pressable accessibilityLabel="Decrease" testID={testID ? testID + '-minus' : undefined} hitSlop={4} onPress={() => onChange(value - 1)} style={{ width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: fg, fontSize: 22, fontFamily: F.bold }}>−</Text></Pressable>
    <Text style={{ color: fg, fontFamily: F.bold, minWidth: 28, textAlign: 'center', fontSize: 15 }}>{value}{unit ? ' ' + unit : ''}</Text>
    <Pressable accessibilityLabel="Increase" testID={testID ? testID + '-plus' : undefined} hitSlop={4} onPress={() => onChange(value + 1)} style={{ width: TAP, height: TAP, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: fg, fontSize: 22, fontFamily: F.bold }}>+</Text></Pressable>
  </View>;
}
export const Segmented = <V extends string>({ value, options, onChange }: { value: V; options: readonly (readonly [V, string])[]; onChange: (v: V) => void }) =>
  <View style={{ flexDirection: 'row', backgroundColor: K.soft, borderRadius: 999, padding: 4 }}>
    {options.map(([k, n]) => <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: value === k }} onPress={() => onChange(k)} style={{ flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: value === k ? K.card : 'transparent' }}>
      <Text style={{ fontFamily: /[\u0B80-\u0BFF]/.test(n) ? F.ta : F.bold, color: K.ink }}>{n}</Text></Pressable>)}
  </View>;

export function Banner({ tone = 'info', icon, title, body, action, onAction, testID }: { tone?: 'info' | 'warn' | 'error' | 'ok'; icon?: string; title: string; body?: string; action?: string; onAction?: () => void; testID?: string }) {
  const [bg, fg, bd] = { info: [K.blueSoft, '#1E3A8A', '#B9CCF7'], warn: [K.yellowSoft, '#5C4300', '#F2D27A'], error: [K.redSoft, '#7A1A12', '#F3B6AE'], ok: [K.greenSoft, '#14532D', '#A8DDB4'] }[tone];
  return <View testID={testID} accessibilityRole="alert" style={{ backgroundColor: bg, borderColor: bd, borderWidth: 1, borderRadius: 16, padding: 12, marginVertical: 6, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
    {!!icon && <Text style={{ fontSize: 20 }}>{icon}</Text>}
    <View style={{ flex: 1 }}><Text style={{ fontFamily: F.bold, color: fg, fontSize: 14 }}>{title}</Text>{!!body && <Text style={{ fontFamily: F.body, color: fg, fontSize: 13, marginTop: 2 }}>{body}</Text>}</View>
    {!!action && <Pressable onPress={onAction} style={{ minHeight: TAP, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ fontFamily: F.bold, color: fg, textDecorationLine: 'underline' }}>{action}</Text></Pressable>}
  </View>;
}
/** Shimmering placeholder block */
export function Skeleton({ h = 16, w = '100%' as any, r = 10, style }: { h?: number; w?: number | string; r?: number; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0.5)).current;
  useEffect(() => { const l = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 650, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(a, { toValue: 0.5, duration: 650, useNativeDriver: Platform.OS !== 'web' })])); l.start(); return () => l.stop(); }, []);
  return <Animated.View style={[{ height: h, width: w as any, borderRadius: r, backgroundColor: K.line, opacity: a }, style]} />;
}
export const SkeletonList = ({ n = 4, testID }: { n?: number; testID?: string }) => <View testID={testID}>{Array.from({ length: n }).map((_, i) =>
  <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: K.card, borderRadius: 20, padding: 14, marginVertical: 6 }}>
    <Skeleton h={56} w={56} r={14} /><View style={{ flex: 1, gap: 8 }}><Skeleton h={14} w="70%" /><Skeleton h={12} w="40%" /></View></View>)}</View>;

/** Connectivity: navigator.onLine on web, a tiny 204 probe on native (no extra native module). */
export function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const u = () => setOn(navigator.onLine); u(); window.addEventListener('online', u); window.addEventListener('offline', u);
      return () => { window.removeEventListener('online', u); window.removeEventListener('offline', u); };
    }
    let live = true; const probe = () => { const c = new AbortController(); const t = setTimeout(() => c.abort(), 5000);
      fetch('https://clients3.google.com/generate_204', { signal: c.signal, cache: 'no-store' as any }).then(() => live && setOn(true)).catch(() => live && setOn(false)).finally(() => clearTimeout(t)); };
    probe(); const i = setInterval(probe, 15000); return () => { live = false; clearInterval(i); };
  }, []);
  return on;
}
export function OfflineBanner() {
  const on = useOnline(); if (on) return null;
  return <View testID="offline-banner" accessibilityRole="alert" style={{ backgroundColor: K.ink, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
    <Text style={{ fontSize: 16 }}>📡</Text><Text style={{ color: '#fff', fontFamily: F.bold, flex: 1 }}>You're offline. We'll sync your cart and orders when you're back.</Text></View>;
}
export function Empty({ emoji, title, body, action, onAction, testID }: { emoji: string; title: string; body?: string; action?: string; onAction?: () => void; testID?: string }) {
  return <View testID={testID} style={{ alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 }}>
    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: K.yellowSoft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 56 }}>{emoji}</Text></View>
    <H size={24} style={{ textAlign: 'center', marginTop: 8 }}>{title}</H>{!!body && <T muted style={{ textAlign: 'center' }}>{body}</T>}
    {!!action && <Button title={action} onPress={onAction} style={{ alignSelf: 'stretch', marginTop: 10 }} />}
  </View>;
}
/** Dark floating pill tab bar — every icon has a text label. */
export function PillTabBar({ state, descriptors, navigation }: any) {
  return <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: K.ink, borderRadius: 999, flexDirection: 'row', padding: 6, gap: 2 }}>
    {state.routes.map((r: any, i: number) => { const d = descriptors[r.key]; const o = d.options; if (o.href === null) return null; const f = state.index === i;
      const label = o.tabBarLabel ?? o.title ?? r.name; const badge = o.tabBarBadge; const center = o.center;
      return <Pressable key={r.key} testID={'tab-' + r.name} accessibilityRole="tab" accessibilityLabel={String(label)} accessibilityState={{ selected: f }}
        onPress={() => { const e = navigation.emit({ type: 'tabPress', target: r.key, canPreventDefault: true }); if (!f && !e.defaultPrevented) navigation.navigate(r.name); }}
        style={{ flex: 1, minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: center ? K.orangeBright : f ? K.yellow : 'transparent' }}>
        <Text style={{ fontSize: center ? 20 : 17 }}>{o.icon}</Text>
        <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: F.bold, color: center ? K.ink : f ? K.ink : '#E9E4D8' }}>{label}</Text>
        {!!badge && <View style={{ position: 'absolute', top: 4, right: '22%', backgroundColor: K.red, borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 11, fontFamily: F.bold }}>{badge}</Text></View>}
      </Pressable>; })}
  </View>;
}
