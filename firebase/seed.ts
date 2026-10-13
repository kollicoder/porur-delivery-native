// Seeds stores, products, riders, settings (+ sample orders) via the client SDK as an 'admin' demo user.
// Emulator (default):   npx tsx firebase/seed.ts
// Real project:          EXPO_PUBLIC_FIREBASE_PROJECT_ID=... EXPO_PUBLIC_FIREBASE_API_KEY=... EXPO_PUBLIC_FIREBASE_APP_ID=... EXPO_PUBLIC_FIREBASE_EMULATOR_HOST= npx tsx firebase/seed.ts
import { writeBatch, doc } from 'firebase/firestore';
import { FirestoreApi } from '../packages/shared/src/firebase';
import { STORES, PRODUCTS, RIDERS } from '../packages/shared/src/catalogue';
import { DEFAULT_SETTINGS } from '../packages/shared/src/pricing';
import { SEED_ORDERS } from '../packages/shared/src/orders';
(async () => {
  const api = new FirestoreApi(); const uid = await api.init('admin'); const b = writeBatch(api.db);
  STORES.forEach(s => b.set(doc(api.db, 'stores', s.id), s));
  PRODUCTS.forEach(p => b.set(doc(api.db, 'products', p.id), { ...p, rx: !!p.rx, inStock: true }));
  RIDERS.forEach(r => b.set(doc(api.db, 'riders', r.id), r));
  b.set(doc(api.db, 'settings', 'app'), DEFAULT_SETTINGS);
  if (!process.argv.includes('--no-orders')) SEED_ORDERS.forEach(o => b.set(doc(api.db, 'orders', o.id), JSON.parse(JSON.stringify({ ...o, customerUid: 'seed-' + o.customer, updatedAt: o.createdAt }))));
  await b.commit();
  console.log(`Seeded ${STORES.length} stores, ${PRODUCTS.length} products, ${RIDERS.length} riders, settings${process.argv.includes('--no-orders') ? '' : `, ${SEED_ORDERS.length} orders`} as ${uid}`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
