// Security-rules check on the EMULATOR with phone-auth users. Run after `npx tsx firebase/seed.ts`.
import { doc, setDoc, updateDoc, getDoc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { FirestoreApi } from '../packages/shared/src/firebase';
const ADMIN = process.env.ADMIN_PHONE || (require('fs').readFileSync(__dirname + '/.admin-bootstrap.local', 'utf8').match(/BOOTSTRAP_ADMIN_PHONE=(\S+)/) || [])[1] || '+16505550000';
let fails = 0;
const exp = async (name: string, p: Promise<any>, allowed: boolean) => {
  try { await p; console.log((allowed ? 'PASS ' : 'FAIL ') + name + ' (allowed)'); if (!allowed) fails++; }
  catch (e: any) { const denied = /permission|PERMISSION/i.test(String(e.message) + String(e.code)); console.log((denied && !allowed ? 'PASS ' : 'FAIL ') + name + ' (denied' + (denied ? '' : ': ' + e.message) + ')'); if (allowed || !denied) fails++; }
};
async function login(name: string, phone: string) {
  const api = new FirestoreApi(name); const ok = new Promise<void>(r => api.onAuth(u => u && r()));
  // Phone sign-in needs a browser; in Node we create the phone user in the Auth emulator and sign in with an unsigned custom token.
  const E = 'http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/demo-porur';
  const look = await (await fetch(E + '/accounts:query', { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ returnUserInfo: true }) })).json();
  let uid = (look.userInfo || []).find((u: any) => u.phoneNumber === phone)?.localId;
  if (!uid) uid = (await (await fetch(E + '/accounts', { method: 'POST', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: phone }) })).json()).localId;
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url'); const now = Math.floor(Date.now() / 1000);
  const token = b64({ alg: 'none', typ: 'JWT' }) + '.' + b64({ uid, iss: 'x@demo-porur.iam.gserviceaccount.com', sub: 'x@demo-porur.iam.gserviceaccount.com', aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iat: now, exp: now + 3600 }) + '.';
  await signInWithCustomToken(api.auth, token); await ok; return api;
}
(async () => {
  const anon = new FirestoreApi('anon');
  await exp('signed-out user reads products', getDoc(doc(anon.db, 'products', 'p1')), false);
  const cust = await login('cust', '+16505550001'); const cu = cust.uid()!;
  await exp('customer reads products', getDoc(doc(cust.db, 'products', 'p1')), true);
  await exp('customer grants self admin role', updateDoc(doc(cust.db, 'users', cu), { role: 'admin' }), false);
  await exp('customer grants self vendor store', updateDoc(doc(cust.db, 'users', cu), { storeId: 's1' }), false);
  await exp('customer files a vendor access request', cust.updateMe({ name: 'Test', request: { role: 'vendor', storeId: 's1', at: new Date().toISOString() } }), true);
  await exp('customer edits settings', setDoc(doc(cust.db, 'settings', 'app'), { fee: 0 }, { merge: true }), false);
  await exp('customer edits product price', updateDoc(doc(cust.db, 'products', 'p1'), { price: 1 }), false);
  await exp('customer creates own order', setDoc(doc(cust.db, 'orders', 'T1'), { id: 'T1', customerUid: cu, status: 'placed', storeId: 's1', rider: 'r1', createdAt: new Date().toISOString() }), true);
  await exp('customer creates order for someone else', setDoc(doc(cust.db, 'orders', 'T2'), { customerUid: 'other', status: 'placed' }), false);
  await exp('customer marks own order delivered', updateDoc(doc(cust.db, 'orders', 'T1'), { status: 'delivered' }), false);
  await exp('customer reads all orders', getDocs(collection(cust.db, 'orders')), false);
  await exp('customer reads own orders', getDocs(query(collection(cust.db, 'orders'), where('customerUid', '==', cu))), true);
  await exp('customer reads other user profile', getDocs(collection(cust.db, 'users')), false);

  const admin = await login('admin', ADMIN);
  await exp('bootstrap admin (phone in rules) reads all users', getDocs(collection(admin.db, 'users')), true);
  await exp('bootstrap admin edits settings', setDoc(doc(admin.db, 'settings', 'app'), { fee: 25 }, { merge: true }), true);
  const ven = await login('ven', '+16505550002'); const vu = ven.uid()!;
  const rid = await login('rid', '+16505550004'); const ru = rid.uid()!;
  await admin.setUserRole(vu, null); await admin.setUserRole(ru, null); // start unapproved
  await new Promise(r => setTimeout(r, 300));
  await exp('vendor (not yet approved) edits price', updateDoc(doc(ven.db, 'products', 'p1'), { price: 33 }), false);
  await exp('admin approves vendor for store s1', admin.setUserRole(vu, 'vendor', { storeId: 's1' }), true);
  await exp('admin approves rider r1', admin.setUserRole(ru, 'rider', { riderId: 'r1' }), true);
  await exp('vendor edits own-store price', updateDoc(doc(ven.db, 'products', 'p1'), { price: 32 }), true);
  await exp('vendor edits other store product', updateDoc(doc(ven.db, 'products', 'p7'), { inStock: false }), false);
  await exp('vendor renames product', updateDoc(doc(ven.db, 'products', 'p1'), { name: 'X' }), false);
  await exp('vendor reads own-store orders', getDocs(query(collection(ven.db, 'orders'), where('storeId', '==', 's1'))), true);
  await exp('vendor reads other-store orders', getDocs(query(collection(ven.db, 'orders'), where('storeId', '==', 's2'))), false);
  await exp('vendor accepts own-store order', updateDoc(doc(ven.db, 'orders', 'T1'), { status: 'accepted' }), true);
  await exp('vendor marks order delivered', updateDoc(doc(ven.db, 'orders', 'T1'), { status: 'delivered' }), false);
  await exp('vendor promotes self to admin', updateDoc(doc(ven.db, 'users', vu), { role: 'admin' }), false);
  await exp('rider updates own GPS', updateDoc(doc(rid.db, 'riders', 'r1'), { lat: 13.04, lng: 80.15, locAt: new Date().toISOString() }), true);
  await exp('rider moves another rider', updateDoc(doc(rid.db, 'riders', 'r2'), { lat: 1, lng: 1 }), false);
  await exp('rider marks assigned order picked up', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'picked_up' }), true);
  await exp('rider reassigns order', updateDoc(doc(rid.db, 'orders', 'T1'), { rider: 'r2' }), false);
  await exp('admin deletes order', deleteDoc(doc(admin.db, 'orders', 'T1')), true);
  console.log(fails ? `${fails} FAILED` : 'ALL RULE CHECKS PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
