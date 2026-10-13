/** Leaflet + OpenStreetMap inside a WebView (native) or an iframe (web). No API key; works in Expo Go. */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
export type Pin = { lat: number; lng: number; emoji: string; label?: string };
const HTML = (center: { lat: number; lng: number }, rings: boolean) => `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#m{height:100%;margin:0}.p{text-align:center}.p div{font-size:24px;line-height:26px}.p small{background:#fff;border-radius:6px;padding:0 4px;font:700 10px sans-serif;white-space:nowrap;box-shadow:0 1px 3px #0003}</style></head>
<body><div id="m"></div><script>
const map=L.map('m').setView([${center.lat},${center.lng}],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
${rings ? `[3000,5000].forEach(r=>L.circle([${center.lat},${center.lng}],{radius:r,color:'#16a34a',weight:2,dashArray:'6 6',fillOpacity:.05}).addTo(map));` : ''}
const g=L.layerGroup().addTo(map);let fitted=false;
window.setPins=function(p){g.clearLayers();p.forEach(m=>L.marker([m.lat,m.lng],{icon:L.divIcon({className:'p',html:'<div>'+m.emoji+'</div>'+(m.label?'<small>'+m.label+'</small>':''),iconSize:[40,40],iconAnchor:[20,20]})}).addTo(g));
 if(!fitted&&p.length>1){map.fitBounds(L.latLngBounds(p.map(m=>[m.lat,m.lng])).pad(.3));fitted=true;}};
window.setPins(__PINS__);
</script></body></html>`;
export function MapView({ pins, height = 200, center = { lat: 13.0382, lng: 80.1565 }, rings = false, testID }: { pins: Pin[]; height?: number; center?: { lat: number; lng: number }; rings?: boolean; testID?: string }) {
  const json = JSON.stringify(pins.filter(p => p.lat && p.lng));
  const [html] = useState(() => HTML(center, rings).replace('__PINS__', json));
  const wv = useRef<any>(null), frame = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === 'web') { try { frame.current?.contentWindow?.setPins?.(JSON.parse(json)); } catch {} }
    else wv.current?.injectJavaScript(`window.setPins && window.setPins(${json}); true;`);
  }, [json]);
  if (Platform.OS === 'web') return <View testID={testID} style={{ height, borderRadius: 16, overflow: 'hidden' }}>{React.createElement('iframe', { ref: frame, srcDoc: html, style: { border: 0, width: '100%', height: '100%' } })}</View>;
  const { WebView } = require('react-native-webview');
  return <View testID={testID} style={{ height, borderRadius: 16, overflow: 'hidden' }}><WebView ref={wv} originWhitelist={['*']} source={{ html }} scrollEnabled={false} /></View>;
}
