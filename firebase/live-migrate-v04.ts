// ONE-OFF v0.4 migration on the LIVE project, signed in as an admin test number (rules must list it as a temporary admin):
// moves delivery OTPs off order docs into orderSecrets/{id}, moves inline prescription photos into prescriptions/{id}.
import { collection, getDocs, writeBatch, doc, deleteField } from 'firebase/firestore';
import { FirestoreApi, testVerifier } from '../packages/shared/src/firebase';
(async () => {
  const api = new FirestoreApi('mig'); api.auth.settings.appVerificationDisabledForTesting = true;
  const ok = new Promise<void>(r => api.onAuth(u => u && r()));
  await api.sendCode(process.env.MIG_PHONE || '+16505550000', testVerifier); await api.confirmCode(process.env.MIG_CODE || '000000'); await ok;
  const snap = await getDocs(collection(api.db, 'orders')); let b = writeBatch(api.db), n = 0, otp = 0, rx = 0;
  for (const d of snap.docs) { const o: any = d.data(); const patch: any = {};
    if (o.otp) { b.set(doc(api.db, 'orderSecrets', d.id), { otp: String(o.otp), customerUid: o.customerUid || '', createdAt: o.createdAt || '' }, { merge: true }); patch.otp = deleteField(); otp++; }
    if (o.prescriptionUri) { if (String(o.prescriptionUri).startsWith('data:') && o.prescriptionUri.length < 300000) b.set(doc(api.db, 'prescriptions', d.id), { img: o.prescriptionUri, storeId: o.storeId || '', customerUid: o.customerUid || '' });
      patch.prescriptionUri = deleteField(); patch.hasRxPhoto = String(o.prescriptionUri).startsWith('data:'); rx++; }
    if (Object.keys(patch).length) { b.update(d.ref, patch); if (++n % 150 === 0) { await b.commit(); b = writeBatch(api.db); } } }
  await b.commit(); console.log(`migrated ${snap.size} orders: ${otp} OTPs → orderSecrets, ${rx} prescriptions → prescriptions`); process.exit(0);
})().catch(e => { console.error('MIGRATE ERR', e.code, e.message); process.exit(1); });
