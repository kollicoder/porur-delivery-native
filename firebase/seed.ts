// Seeds stores, products, riders, settings (+ sample orders) and demo users.
// Emulator (default): uses firebase-admin against the emulator (no credentials, bypasses rules).
//   npx tsx firebase/seed.ts [--no-orders] [--clear-orders]
// Real project: run from the web admin (signed in as admin) — or with gcloud ADC: GOOGLE_CLOUD_PROJECT=... npx tsx firebase/seed.ts --live
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { STORES, PRODUCTS, RIDERS } from '../packages/shared/src/catalogue';
import { DEFAULT_SETTINGS } from '../packages/shared/src/pricing';
import { SEED_ORDERS } from '../packages/shared/src/orders';
const live = process.argv.includes('--live');
if (!live) process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
const projectId = live ? process.env.GOOGLE_CLOUD_PROJECT! : 'demo-porur';
(async () => {
  initializeApp({ projectId }); const db = getFirestore(); const b = db.batch();
  if (process.argv.includes('--clear-orders')) for (const c of ['orders', 'errands']) (await db.collection(c).get()).docs.forEach(d => b.delete(d.ref));
  STORES.forEach(s => b.set(db.doc('stores/' + s.id), s));
  PRODUCTS.forEach(p => b.set(db.doc('products/' + p.id), { ...p, rx: !!p.rx, inStock: true }));
  RIDERS.forEach(r => b.set(db.doc('riders/' + r.id), r));
  b.set(db.doc('settings/app'), DEFAULT_SETTINGS);
  if (!process.argv.includes('--no-orders')) SEED_ORDERS.forEach(o => b.set(db.doc('orders/' + o.id), JSON.parse(JSON.stringify({ ...o, customerUid: 'seed-' + o.customer, updatedAt: o.createdAt }))));
  await b.commit();
  console.log(`Seeded ${STORES.length} stores, ${PRODUCTS.length} products, ${RIDERS.length} riders, settings${process.argv.includes('--no-orders') ? '' : `, ${SEED_ORDERS.length} orders`} into ${projectId}`);
})().catch(e => { console.error(e); process.exit(1); });
