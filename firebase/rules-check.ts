// Verifies key security rules with a non-admin user. Usage like seed.ts.
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { FirestoreApi } from '../packages/shared/src/firebase';
const exp = async (name: string, p: Promise<any>, allowed: boolean) => { try { await p; console.log((allowed ? 'PASS ' : 'FAIL ') + name + ' (allowed)'); } catch { console.log((allowed ? 'FAIL ' : 'PASS ') + name + ' (denied)'); } };
(async () => {
  const api = new FirestoreApi(); await signOut(api.auth);
  await exp('unauthenticated read products', getDoc(doc(api.db, 'products', 'p1')), false);
  await api.init('customer');
  await exp('customer reads products', getDoc(doc(api.db, 'products', 'p1')), true);
  await exp('customer edits settings', setDoc(doc(api.db, 'settings', 'app'), { fee: 0 }, { merge: true }), false);
  await exp('customer edits product price', updateDoc(doc(api.db, 'products', 'p1'), { price: 1 }), false);
  await exp('customer creates order for someone else', setDoc(doc(api.db, 'orders', 'X1'), { customerUid: 'other', status: 'placed' }), false);
  await exp('customer marks own order delivered', (async () => { await setDoc(doc(api.db, 'orders', 'X2'), { customerUid: api.uid(), status: 'placed', createdAt: '' }); await updateDoc(doc(api.db, 'orders', 'X2'), { status: 'delivered' }); })(), false);
  await api.init('vendor');
  await exp('vendor edits product price', updateDoc(doc(api.db, 'products', 'p1'), { price: 32 }), true);
  await exp('vendor renames product', updateDoc(doc(api.db, 'products', 'p1'), { name: 'X' }), false);
  await exp('vendor edits settings', setDoc(doc(api.db, 'settings', 'app'), { fee: 0 }, { merge: true }), false);
  process.exit(0);
})();
