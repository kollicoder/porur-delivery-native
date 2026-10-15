import React from 'react';
import { ScrollView, Text } from 'react-native';
import { BRAND } from '@porur/shared';
import { K, F, Card } from '@porur/shared/src/ui/kit';
import { s } from '../src/theme';
/** Moved out of the shopping flow (v0.5): attributions live under Profile → About. */
export default function Credits() {
  return <ScrollView style={s.page} contentContainerStyle={s.pad}>
    <Card><Text style={{ fontFamily: F.display, fontSize: 18, color: K.ink }}>{BRAND.name}</Text><Text style={s.muted}>Hyperlocal delivery for {BRAND.area}. Version 0.5.</Text></Card>
    <Card><Text style={{ fontFamily: F.bold, color: K.ink }}>Maps</Text><Text style={s.muted}>© OpenStreetMap contributors, rendered with Leaflet.</Text></Card>
    <Card><Text style={{ fontFamily: F.bold, color: K.ink }}>Fonts</Text><Text style={s.muted}>Bricolage Grotesque, Plus Jakarta Sans, Noto Sans Tamil — SIL Open Font License.</Text></Card>
    <Card><Text style={{ fontFamily: F.bold, color: K.ink }}>Product imagery</Text><Text style={s.muted}>Product photos shown in the design mock-ups are placeholders; final store-supplied photos and their credits will be listed here.</Text></Card>
  </ScrollView>;
}
