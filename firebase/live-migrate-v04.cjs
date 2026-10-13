// ONE-OFF v0.4 migration on LIVE via REST (Node can't use the phone-auth SDK): sign in with an admin TEST number,
// move delivery OTPs off order docs into orderSecrets/{id}, inline prescription photos into prescriptions/{id}.
const K = 'AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA', P = 'study-vignes', PHONE = process.env.MIG_PHONE || '+16505550000', CODE = process.env.MIG_CODE || '000000';
const j = async (u, o) => { const r = await fetch(u, o); const t = await r.json(); if (!r.ok) throw new Error(u.split('?')[0] + ' ' + JSON.stringify(t.error || t)); return t; };
const post = (u, b, tok) => j(u, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: JSON.stringify(b) });
(async () => {
  const IT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  const { sessionInfo } = await post(IT + 'sendVerificationCode?key=' + K, { phoneNumber: PHONE });
  const { idToken } = await post(IT + 'signInWithPhoneNumber?key=' + K, { sessionInfo, code: CODE });
  const DB = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`;
  let docs = [], pageToken = '';
  do { const r = await j(`${DB}/orders?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`, { headers: { Authorization: 'Bearer ' + idToken } }); docs.push(...(r.documents || [])); pageToken = r.nextPageToken; } while (pageToken);
  const writes = []; let otp = 0, rx = 0; const S = v => ({ stringValue: String(v ?? '') });
  for (const d of docs) { const f = d.fields || {}, id = d.name.split('/').pop(), mask = [];
    if (f.otp) { writes.push({ update: { name: `projects/${P}/databases/(default)/documents/orderSecrets/${id}`, fields: { otp: S(f.otp.stringValue ?? f.otp.integerValue), customerUid: f.customerUid || S(''), createdAt: f.createdAt || S('') } } }); mask.push('otp'); otp++; }
    if (f.prescriptionUri) { const v = f.prescriptionUri.stringValue || ''; if (v.startsWith('data:') && v.length < 300000) writes.push({ update: { name: `projects/${P}/databases/(default)/documents/prescriptions/${id}`, fields: { img: S(v), storeId: f.storeId || S(''), customerUid: f.customerUid || S('') } } }); mask.push('prescriptionUri'); rx++; }
    if (mask.length) writes.push({ update: { name: d.name, fields: {} }, updateMask: { fieldPaths: mask }, currentDocument: { exists: true } }); }
  for (let i = 0; i < writes.length; i += 400) await post(`https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents:commit`, { writes: writes.slice(i, i + 400) }, idToken);
  console.log(`migrated ${docs.length} orders: ${otp} OTPs → orderSecrets, ${rx} prescriptions → prescriptions`);
})().catch(e => { console.error('MIGRATE ERR', e.message); process.exit(1); });
