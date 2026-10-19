// ONE-OFF v0.6 seed on LIVE (study-vignes) via REST, signed in as the admin TEST number (needs rules rendered with it).
// Writes kitchens/food products, FSSAI flags, communities, this week's list, settings/deals; opens a meter only if none is open.
import { v6SeedDocs } from './seed-v6';
const K = 'AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA', P = 'study-vignes', PHONE = process.env.MIG_PHONE || '+919000000000', CODE = process.env.MIG_CODE || '000000';
const ROOT = `projects/${P}/databases/(default)/documents`, DB = 'https://firestore.googleapis.com/v1/' + ROOT;
const j = async (u: string, o?: any) => { const r = await fetch(u, o); const t: any = await r.json(); if (!r.ok) throw new Error(u.split('?')[0] + ' ' + JSON.stringify(t.error || t)); return t; };
const post = (u: string, b: any, tok?: string) => j(u, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify(b) });
const val = (v: any): any => v === null ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : { mapValue: { fields: fields(v) } };
const fields = (o: any) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, val(v)]));
(async () => {
  const IT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  const { sessionInfo } = await post(IT + 'sendVerificationCode?key=' + K, { phoneNumber: PHONE });
  const { idToken } = await post(IT + 'signInWithPhoneNumber?key=' + K, { sessionInfo, code: CODE });
  const H = { headers: { Authorization: 'Bearer ' + idToken } };
  const meters = await j(`${DB}:runQuery`, { method: 'POST', ...H, headers: { ...H.headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'meters' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'open' } } } } }) });
  const hasOpen = meters.some((r: any) => r.document);
  const writes: any[] = []; let n = 0;
  for (const [path, data, merge] of v6SeedDocs()) {
    if (path.startsWith('meters/') && hasOpen) continue;
    const w: any = { update: { name: `${ROOT}/${path}`, fields: fields(data) } }; if (merge) w.updateMask = { fieldPaths: Object.keys(data) }; writes.push(w); n++; }
  await post(`${DB}:commit`, { writes }, idToken);
  console.log(`v0.6 live seed: ${n} docs written${hasOpen ? ' (meter already open — kept)' : ' (opened M-porur-west-1)'}`);
})().catch(e => { console.error('MIGRATE ERR', e.message); process.exit(1); });
