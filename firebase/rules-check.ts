// Security-rules check on the EMULATOR with phone-auth users. Run after `npx tsx firebase/seed.ts`.
import { doc, setDoc, updateDoc, getDoc, getDocs, collection, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { FirestoreApi } from '../packages/shared/src/firebase';
const ADMIN = process.env.ADMIN_PHONE || (require('fs').readFileSync(__dirname + '/.admin-bootstrap.local', 'utf8').match(/BOOTSTRAP_ADMIN_PHONE=(\S+)/) || [])[1] || '+919000000000';
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
  const cust = await login('cust', '+919000000001'); const cu = cust.uid()!;
  await exp('customer reads products', getDoc(doc(cust.db, 'products', 'p1')), true);
  await exp('customer grants self admin role', updateDoc(doc(cust.db, 'users', cu), { role: 'admin' }), false);
  await exp('customer grants self vendor store', updateDoc(doc(cust.db, 'users', cu), { storeId: 's1' }), false);
  await exp('customer files a vendor access request', cust.updateMe({ name: 'Test', request: { role: 'vendor', storeId: 's1', at: new Date().toISOString() } }), true);
  await exp('customer edits settings', setDoc(doc(cust.db, 'settings', 'app'), { fee: 0 }, { merge: true }), false);
  await exp('customer edits product price', updateDoc(doc(cust.db, 'products', 'p1'), { price: 1 }), false);
  const T = (id: string, o: any = {}, sec: any = { otp: '4321', customerUid: cu }) => { const b = writeBatch(cust.db);
    b.set(doc(cust.db, 'orders', id), { id, customerUid: cu, status: 'placed', storeId: 's1', pay: 'COD', paymentStatus: 'due', createdAt: new Date().toISOString(), ...o });
    if (sec) b.set(doc(cust.db, 'orderSecrets', id), sec); return b.commit(); };
  await exp('customer creates own order + private OTP doc', T('T1'), true);
  await exp('customer creates order WITHOUT the private OTP doc', T('T0', {}, null), false);
  await exp('customer puts OTP on the order doc', T('T3', { otp: '1111' }), false);
  await exp('customer creates order marked payment collected', T('T4', { paymentStatus: 'collected' }), false);
  await exp('customer creates order claiming online prepaid (UPI)', T('T5', { pay: 'UPI' }), false);
  await exp('customer creates order for someone else', setDoc(doc(cust.db, 'orders', 'T2'), { customerUid: 'other', status: 'placed' }), false);
  await exp('customer pre-assigns an OFFLINE rider (r5)', T('T6', { rider: 'r5' }), false);
  await exp('customer creates errand pre-assigned to ONLINE rider r1', T('E1', { type: 'errand', storeId: '', rider: 'r1' }), true);
  await exp('customer reads own delivery OTP', getDoc(doc(cust.db, 'orderSecrets', 'T1')), true);
  await exp('customer adds prescription later to own order', setDoc(doc(cust.db, 'prescriptions', 'T1'), { img: 'data:image/jpeg;base64,AAAA', storeId: 's1', customerUid: cu }), true);
  { const b = writeBatch(cust.db); b.set(doc(cust.db, 'orders', 'T7'), { id: 'T7', customerUid: cu, status: 'placed', storeId: 's3', pay: 'COD', createdAt: new Date().toISOString() });
    b.set(doc(cust.db, 'orderSecrets', 'T7'), { otp: '1234', customerUid: cu }); b.set(doc(cust.db, 'prescriptions', 'T7'), { img: 'x'.repeat(400000), storeId: 's3', customerUid: cu });
    await exp('customer attaches OVERSIZED prescription (>300 KB)', b.commit(), false); }
  { const b = writeBatch(cust.db); b.set(doc(cust.db, 'orders', 'T8'), { id: 'T8', customerUid: cu, status: 'placed', storeId: 's3', pay: 'UPI_DOD', createdAt: new Date().toISOString() });
    b.set(doc(cust.db, 'orderSecrets', 'T8'), { otp: '1234', customerUid: cu }); b.set(doc(cust.db, 'prescriptions', 'T8'), { img: 'data:image/jpeg;base64,AAAA', storeId: 's3', customerUid: cu });
    await exp('customer creates Rx order with prescription in its own doc', b.commit(), true); }
  await exp('customer marks own order delivered', updateDoc(doc(cust.db, 'orders', 'T1'), { status: 'delivered' }), false);
  await exp('customer reads all orders', getDocs(collection(cust.db, 'orders')), false);
  await exp('customer reads own orders', getDocs(query(collection(cust.db, 'orders'), where('customerUid', '==', cu))), true);
  await exp('customer reads other user profile', getDocs(collection(cust.db, 'users')), false);

  const admin = await login('admin', ADMIN);
  await exp('bootstrap admin (phone in rules) reads all users', getDocs(collection(admin.db, 'users')), true);
  await exp('bootstrap admin edits settings', setDoc(doc(admin.db, 'settings', 'app'), { fee: 25 }, { merge: true }), true);
  const ven = await login('ven', '+919000000002'); const vu = ven.uid()!;
  const rid = await login('rid', '+919000000004'); const ru = rid.uid()!;
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
  await exp('vendor reads delivery OTP', getDoc(doc(ven.db, 'orderSecrets', 'T1')), false);
  await exp('vendor accepts + assigns OFFLINE rider r5', updateDoc(doc(ven.db, 'orders', 'T1'), { status: 'accepted', rider: 'r5' }), false);
  await exp('vendor accepts + auto-assigns ONLINE rider r1', updateDoc(doc(ven.db, 'orders', 'T1'), { status: 'accepted', rider: 'r1' }), true);
  await exp('vendor re-assigns rider after accept', updateDoc(doc(ven.db, 'orders', 'T1'), { rider: 'r3' }), false);
  await exp('vendor marks order delivered', updateDoc(doc(ven.db, 'orders', 'T1'), { status: 'delivered' }), false);
  await exp('vendor promotes self to admin', updateDoc(doc(ven.db, 'users', vu), { role: 'admin' }), false);
  await exp('rider updates own GPS', updateDoc(doc(rid.db, 'riders', 'r1'), { lat: 13.04, lng: 80.15, locAt: new Date().toISOString() }), true);
  await exp('rider moves another rider', updateDoc(doc(rid.db, 'riders', 'r2'), { lat: 1, lng: 1 }), false);
  await exp('rider reads delivery OTP doc', getDoc(doc(rid.db, 'orderSecrets', 'T1')), false);
  await exp('rider reads prescription photo', getDoc(doc(rid.db, 'prescriptions', 'T8')), false);
  await exp('vendor of another store reads prescription', getDoc(doc(ven.db, 'prescriptions', 'T8')), false);
  await exp('admin reads prescription', getDoc(doc(admin.db, 'prescriptions', 'T8')), true);
  await exp('rider marks assigned order picked up', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'picked_up' }), true);
  await exp('rider reassigns order', updateDoc(doc(rid.db, 'orders', 'T1'), { rider: 'r2' }), false);
  await exp('rider marks delivered WITHOUT code', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'delivered' }), false);
  await exp('rider marks delivered with WRONG code', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'delivered', deliveryCode: '0000' }), false);
  await exp('rider marks payment collected before delivery', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'on_the_way', paymentStatus: 'collected' }), false);
  await exp('rider marks delivered with CORRECT code + cash collected', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'delivered', deliveryCode: '4321', paymentStatus: 'collected', collectedVia: 'cash', deliveredAt: new Date().toISOString() }), true);
  await exp('rider changes a delivered order', updateDoc(doc(rid.db, 'orders', 'T1'), { status: 'on_the_way' }), false);
  await exp('rider registers push token for own rider id', setDoc(doc(rid.db, 'pushTokens', ru), { token: 'ExponentPushToken[x]', riderId: 'r1' }), true);
  await exp('customer registers push token posing as rider r1', setDoc(doc(cust.db, 'pushTokens', cu), { token: 'ExponentPushToken[y]', riderId: 'r1' }), false);
  await exp('vendor registers push token for own store', setDoc(doc(ven.db, 'pushTokens', vu), { token: 'ExponentPushToken[z]', storeId: 's1' }), true);
  await exp('customer looks up store s1 push tokens', getDocs(query(collection(cust.db, 'pushTokens'), where('storeId', '==', 's1'))), true);
  await exp('admin deletes order', deleteDoc(doc(admin.db, 'orders', 'T1')), true);
  console.log(fails ? `${fails} FAILED` : 'ALL RULE CHECKS PASSED'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERR', e); process.exit(1); });
