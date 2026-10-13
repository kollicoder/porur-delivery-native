// ONE-OFF, run against the LIVE project while the v0.2 rules (anonymous + self-picked role) are still deployed:
// clears all orders/errands (test data), refreshes stores/products/riders/settings with map coordinates, re-adds sample orders.
import { writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, setDoc } from 'firebase/firestore';
import { STORES, PRODUCTS, RIDERS } from '../packages/shared/src/catalogue';
import { DEFAULT_SETTINGS } from '../packages/shared/src/pricing';
import { SEED_ORDERS } from '../packages/shared/src/orders';
(async () => {
  const app = initializeApp({ projectId: 'study-vignes', apiKey: 'AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA', appId: '1:350770556092:web:fca4082f0d1c98e119f4b9' });
  const u = (await signInAnonymously(getAuth(app))).user; const db = getFirestore(app);
  await setDoc(doc(db, 'users', u.uid), { role: 'admin' }, { merge: true });
  const b = writeBatch(db); let n = 0;
  for (const c of ['orders', 'errands']) (await getDocs(collection(db, c))).docs.forEach(d => { b.delete(d.ref); n++; });
  STORES.forEach(s => b.set(doc(db, 'stores', s.id), s));
  PRODUCTS.forEach(p => b.set(doc(db, 'products', p.id), { ...p, rx: !!p.rx, inStock: true }));
  RIDERS.forEach(r => b.set(doc(db, 'riders', r.id), r));
  b.set(doc(db, 'settings', 'app'), DEFAULT_SETTINGS);
  SEED_ORDERS.forEach(o => b.set(doc(db, 'orders', o.id), JSON.parse(JSON.stringify({ ...o, customerUid: 'seed-' + o.customer, updatedAt: o.createdAt }))));
  await b.commit(); console.log(`live: deleted ${n} order/errand docs, refreshed catalogue + ${SEED_ORDERS.length} sample orders`); process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
