// v0.4 E2E (emulator or LIVE): mixed-cart pricing, private delivery OTP, auto-dispatch, pay-on-delivery, private prescriptions.
const { chromium } = require('/workspace/porur-prototype/node_modules/playwright');
const env = process.env; const LIVE = !!env.LIVE; const Q = LIVE ? '?test=1' : '';
const [P, NC, NV, TAG] = [env.PROTO || 'http://localhost:4173/', env.NCUST || 'http://localhost:8081', env.NVEND || 'http://localhost:8082', env.TAG || 'emu'];
const PH = { admin: '+16505550000', cust: '+16505550001', vend: '+16505550002', rider: '+16505550004' };
const LIVECODE = { '+16505550000': '000000', '+16505550001': '111111', '+16505550002': '222222', '+16505550004': '444444' };
const results = []; const ok = (n, c, extra = '') => { results.push((c ? 'PASS ' : 'FAIL ') + n + (extra ? ' — ' + extra : '')); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
let db; if (!LIVE) { process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'; const { initializeApp } = require('firebase-admin/app'); initializeApp({ projectId: 'demo-porur' }); db = require('firebase-admin/firestore').getFirestore(); }
async function codeFor(phone) {
  if (LIVE) return LIVECODE[phone];
  for (let i = 0; i < 20; i++) { const j = await (await fetch('http://localhost:9099/emulator/v1/projects/demo-porur/verificationCodes')).json();
    const c = (j.verificationCodes || []).filter(v => v.phoneNumber === phone).pop(); if (c) return c.code; await wait(300); }
}
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, geolocation: { latitude: 13.0502, longitude: 80.1655 }, permissions: ['geolocation'] }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const shot = (p, n) => p.screenshot({ path: `screenshots/v4/${TAG}-${n}.png` });
  const login = async (p, phone) => { const f = p.getByTestId('phone'); await f.waitFor({ timeout: 25000 }); await f.fill(phone); await p.getByTestId('send-code').click();
    await p.getByTestId('otp').waitFor({ timeout: 20000 }); await p.getByTestId('otp').fill(await codeFor(phone)); await p.getByTestId('verify').click(); await wait(3500); };
  const admin = await mk(1440, 900), cust = await mk(390, 844), vend = await mk(390, 844), rider = await mk(390, 844), ncust = await mk(390, 844);
  // Known rider state for dispatch: Karthik (r1) online with a fresh GPS fix near the store; others' GPS stale.
  if (db) { const now = Date.now(); for (let i = 1; i <= 10; i++) await db.doc('riders/r' + i).update({ locAt: new Date(now - 3 * 3600e3).toISOString() });
    await db.doc('riders/r1').update({ status: 'online', lat: 13.0362, lng: 80.1578, locAt: new Date().toISOString() }); }
  await admin.goto(P + Q + '#/admin-desktop/orders'); await login(admin, PH.admin);
  await vend.goto(NV + Q); await login(vend, PH.vend); await vend.waitForURL(/orders/, { timeout: 20000 }).catch(() => {});
  ok('vendor (s1) signs in to orders', /orders/.test(vend.url()));
  await rider.goto(P + Q + '#/rider/home'); await login(rider, PH.rider);
  ok('rider view loads', await rider.getByTestId('gps-share').isVisible({ timeout: 15000 }).catch(() => false));
  // 1. Mixed cart (fruit store + pharmacy) — the "₹411 for ~₹200" scenario
  await cust.goto(P + Q + '#/customer/voice'); await login(cust, PH.cust); await cust.goto(P + Q + '#/customer/voice'); await wait(1500);
  await cust.fill('textarea', '2 kg tomato, 1 thermometer, 1 paracetamol'); await cust.getByText('Understand my order').click(); await cust.getByText(/Add 3 item/).click(); await wait(800);
  await cust.getByText('Proceed to checkout →').click(); await wait(1200);
  const bill = await cust.getByTestId('bill').textContent();
  ok('checkout bill: items ₹283 + one ₹25 fee = ₹308', /Item total₹283/.test(bill) && /once for this checkout/.test(bill) && /₹308/.test(bill), bill);
  ok('online pay shown as COMING SOON (not faked)', /COMING SOON/.test(await cust.getByTestId('pay-online').textContent()));
  await cust.getByTestId('pay-UPI_DOD').click(); await shot(cust, '01-checkout-bill-pay');
  await cust.getByTestId('place').click(); await cust.waitForURL(/track\/PD/, { timeout: 20000 }); await wait(2500);
  const id1 = cust.url().split('/').pop();
  const ob = await cust.getByTestId('order-bill').textContent(); ok('tracking shows per-line prices, item total, fee, part n of 2', /Part \d of 2/.test(ob) && /Item total/.test(ob) && /Delivery fee/.test(ob), ob);
  const otpTxt = await cust.getByTestId('otp-card').textContent(); const custOtp = (otpTxt.match(/(\d{4})/) || [])[1];
  ok('customer sees their delivery OTP (from private doc)', !!custOtp); await shot(cust, '02-customer-track-bill-otp');
  let parts = []; if (db) { const o = (await db.doc('orders/' + id1).get()).data(); parts = (await db.collection('orders').where('groupId', '==', o.groupId).get()).docs.map(d => d.data());
    const sumT = parts.reduce((a, x) => a + x.total, 0), sumF = parts.reduce((a, x) => a + x.fee, 0);
    ok('split orders: Σtotal ₹308, fee charged once (₹25), each bill adds up', parts.length === 2 && sumT === 308 && sumF === 25 && parts.every(x => x.total === x.subtotal + x.fee && x.subtotal === x.lines.reduce((a, l) => a + l.price * l.qty, 0)), parts.map(x => `${x.storeId}:${x.subtotal}+${x.fee}=${x.total}`).join(' '));
    ok('order docs carry NO otp / rider before accept', parts.every(x => !('otp' in x) && !x.rider)); }
  const s1 = parts.find(x => x.storeId === 's1') || { id: id1 };
  // 2. Vendor accepts → auto-dispatch
  const accept = vend.getByTestId('accept-' + s1.id); await accept.waitFor({ timeout: 20000 }); await accept.click(); await wait(2500);
  const note = await vend.getByTestId('dispatch-note').textContent().catch(() => ''); ok('vendor accept auto-assigns nearest online rider (Karthik)', /Karthik/.test(note), note); await shot(vend, '03-vendor-auto-dispatch');
  if (db) ok('order.rider = r1 in Firestore', (await db.doc('orders/' + s1.id).get()).data().rider === 'r1');
  await vend.getByText('📦 Ready for pickup').first().click(); await wait(2000);
  // 3. Rider: no OTP visible; wrong code rejected by rules; right code accepted
  const card = rider.locator('.rcard', { hasText: s1.id }); await card.waitFor({ timeout: 20000 });
  await card.getByText('Picked up').click(); await wait(1500); await card.getByText('Start trip').click(); await wait(2000);
  const rtext = await rider.textContent('body'); ok('rider screen has no OTP hint / code', !/OTP is/.test(rtext) && !(custOtp && rtext.includes(custOtp)));
  await card.locator('input').fill(custOtp === '0000' ? '1111' : '0000'); await card.getByTestId('deliver-' + s1.id).click(); await wait(2500);
  ok('wrong OTP → denied by Firestore rules', /Wrong OTP/.test(await card.textContent())); await shot(rider, '04-rider-wrong-otp');
  await card.locator('input').fill(custOtp); await card.getByTestId('deliver-' + s1.id).click(); await wait(3000);
  if (db) { const d = (await db.doc('orders/' + s1.id).get()).data(); ok('correct OTP → delivered + UPI collected', d.status === 'delivered' && d.paymentStatus === 'collected' && d.collectedVia === 'upi'); }
  await cust.goto(P + Q + '#/customer/track/' + s1.id); await wait(2500); ok('customer sees Delivered + paid', /Delivered/.test(await cust.textContent('body')) && /Paid \(UPI\)/.test(await cust.textContent('body'))); await shot(cust, '05-customer-delivered-paid');
  await rider.goto(P + Q + '#/rider/home'); await wait(1500); await shot(rider, '06-rider-view');
  // 4. Errand auto-dispatch
  await cust.goto(P + Q + '#/customer/rider'); await wait(1500); await cust.getByText(/Book rider ·/).click(); await cust.waitForURL(/track\/ER/, { timeout: 20000 }); await wait(2000);
  const eid = cust.url().split('/').pop(); if (db) { const e = (await db.doc('orders/' + eid).get()).data(); ok('errand auto-assigned to an online rider', !!e.rider, 'rider=' + e.rider); }
  ok('errand tracking shows assigned rider', /is your rider/.test(await cust.textContent('body'))); await shot(cust, '07-errand-auto-rider');
  // 5. Admin sees OTP (admin only) + can reassign
  await admin.goto(P + Q + '#/admin-desktop/orders'); await wait(3000); await admin.getByText(eid).first().click(); await wait(1500);
  ok('admin detail shows OTP (admin only) + reassign', /Delivery OTP \(admin only\): \d{4}/.test(await admin.textContent('body'))); await shot(admin, '08-admin-order-detail');
  // 6. Native customer app: other part shows bill + OTP; native checkout pay options
  const other = parts.find(x => x.storeId !== 's1');
  await ncust.goto(NC + Q); await login(ncust, PH.cust);
  if (other) { await ncust.goto(NC + '/order/' + other.id); await wait(5000); const t = await ncust.textContent('body');
    ok('native tracking: OTP from private doc + bill breakdown', new RegExp('Delivery OTP: +\\d{4}').test(t) && /Item total/.test(t) && /on part 1|Delivery fee/.test(t), t.slice(0, 0)); await shot(ncust, '09-native-track'); }
  await ncust.goto(NC); await ncust.getByTestId('add-p8').first().click({ timeout: 15000 }).catch(() => {}); await ncust.goto(NC + '/category/grocery').catch(() => {}); await wait(2000);
  for (const pid of ['p8', 'p12']) { await ncust.getByTestId('add-' + pid).first().click({ timeout: 8000 }).catch(() => {}); await wait(400); }
  await ncust.goto(NC + '/checkout'); await wait(3500); const nt = await ncust.textContent('body');
  ok('native checkout: cash/UPI on delivery + online COMING SOON', /Cash on delivery/.test(nt) && /UPI on delivery/.test(nt) && /COMING SOON/.test(nt)); await shot(ncust, '10-native-checkout');
  console.log(results.join('\n')); console.log('page errors:', errs.length ? errs.slice(0, 5) : 'none'); await b.close();
})().catch(async e => { console.log(results.join('\n')); console.error('E2E error:', e.message); process.exit(1); });
