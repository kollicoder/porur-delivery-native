import { StyleSheet } from 'react-native';
export const C = { green:'#16a34a', dark:'#111827', muted:'#6b7280', bg:'#f8fafc', card:'#fff', orange:'#f97316', line:'#e5e7eb' };
export const TA = 'NotoSansTamil_400Regular';
export const s = StyleSheet.create({
  page:{ flex:1, backgroundColor:C.bg }, pad:{ padding:14, paddingBottom:120 },
  card:{ backgroundColor:C.card, borderRadius:14, padding:12, marginVertical:6, shadowColor:'#000', shadowOpacity:0.06, shadowRadius:4, elevation:1 },
  h1:{ fontSize:22, fontWeight:'800', color:C.dark }, h3:{ fontSize:16, fontWeight:'700', marginTop:16, marginBottom:8, color:C.dark },
  muted:{ color:C.muted, fontSize:13 }, row:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  btn:{ backgroundColor:C.green, borderRadius:12, padding:14, alignItems:'center', marginTop:12 }, btnTxt:{ color:'#fff', fontWeight:'700', fontSize:15 },
  input:{ borderWidth:1.5, borderColor:'#d1d5db', borderRadius:12, padding:11, fontSize:15, backgroundColor:'#fff' },
  label:{ fontWeight:'600', fontSize:13, marginTop:12, marginBottom:5, color:'#374151' },
  chip:{ borderWidth:1, borderColor:'#d1d5db', borderRadius:20, paddingHorizontal:11, paddingVertical:5, backgroundColor:'#fff', marginRight:6, marginBottom:6 },
});
