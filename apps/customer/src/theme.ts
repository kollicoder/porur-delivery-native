import { StyleSheet } from 'react-native';
import { K, F } from '@porur/shared/src/ui/kit';
export { K, F };
// v0.5: legacy names mapped onto the ding-dong palette (AA contrast)
export const C = { green: K.green, dark: K.ink, muted: K.muted, bg: K.bg, card: K.card, orange: K.orange, line: K.line, yellow: K.yellow };
export const TA = F.ta;
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: K.bg }, pad: { padding: 16, paddingBottom: 130 },
  card: { backgroundColor: K.card, borderRadius: 20, padding: 14, marginVertical: 6, borderWidth: 1, borderColor: K.line },
  h1: { fontSize: 26, fontFamily: F.display, color: K.ink }, h3: { fontSize: 19, fontFamily: F.display, marginTop: 18, marginBottom: 8, color: K.ink },
  muted: { color: K.muted, fontSize: 13, fontFamily: F.body }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { backgroundColor: K.ink, borderRadius: 999, minHeight: 52, padding: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, btnTxt: { color: '#fff', fontFamily: F.bold, fontSize: 16 },
  input: { borderWidth: 1.5, borderColor: K.line, borderRadius: 16, padding: 13, fontSize: 16, backgroundColor: '#fff', fontFamily: F.body, color: K.ink },
  label: { fontFamily: F.bold, fontSize: 14, marginTop: 14, marginBottom: 6, color: K.ink2 },
  chip: { borderWidth: 1, borderColor: K.line, borderRadius: 999, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', backgroundColor: '#fff', marginRight: 8, marginBottom: 8 },
});
