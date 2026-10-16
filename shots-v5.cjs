// v0.5 screenshots on the EMULATOR (run after seed): native customer + vendor web exports, prototype rider + admin desktop.
const { chromium } = require('/workspace/porur-prototype/node_modules/playwright');
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'; const { initializeApp } = require('firebase-admin/app'); initializeApp({ projectId: 'demo-porur' }); const db = require('firebase-admin/firestore').getFirestore();
const [P, NC, NV] = ['http://localhost:4173/', 'http://localhost:8081', 'http://localhost:8082'];
const w = ms => new Promise(r => setTimeout(r, ms)); const OUT = 'screenshots/v5/';
async function codeFor(phone) { for (let i = 0; i < 20; i++) { const j = await (await fetch('http://localhost:9099/emulator/v1/projects/demo-porur/verificationCodes')).json();
  const c = (j.verificationCodes || []).filter(v => v.phoneNumber === phone).pop(); if (c) return c.code; await w(300); } }
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (wd, h, dsf = 2) => { const c = await b.newContext({ viewport: { width: wd, height: h }, deviceScaleFactor: dsf, geolocation: { latitude: 13.0502, longitude: 80.1655 }, permissions: ['geolocation'] }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const sh = (p, n, full) => p.screenshot({ path: OUT + n + '.png', fullPage: !!full });
  const login = async (p, phone, pre) => { const f = p.getByTestId('phone'); await f.waitFor({ timeout: 25000 }); await f.fill(phone); if (pre) await sh(p, pre + '-a-phone'); await p.getByTestId('send-code').click();
    await p.getByTestId('otp').waitFor({ timeout: 20000 });
    if (pre) { await p.getByTestId('otp').fill('000001'); await p.getByTestId('verify').click(); await w(1500); await sh(p, pre + '-b-otp-wrong-resend-timer'); }
    await p.getByTestId('otp').fill(await codeFor(phone)); await p.getByTestId('verify').click(); await w(3500); };
  const c = await mk(390, 844);
  await c.goto(NC); await login(c, '+919000000001', 'c01-login');
  await c.goto(NC); await w(3000); await sh(c, 'c02-home');
  await c.setViewportSize({ width: 360, height: 640 }); await w(800); await sh(c, 'c02b-home-360x640-above-fold'); await c.setViewportSize({ width: 390, height: 844 });
  await c.goto(NC + '/category/fv'); await w(2500); await c.getByTestId('add-p1').click(); await w(300); await sh(c, 'c03-category-fruits-veg');
  await c.goto(NC + '/search'); await w(1500); await c.getByTestId('search-input').fill('xyz cake'); await w(800); await sh(c, 'c04-search-empty');
  await c.getByTestId('search-input').fill('milk'); await w(800); await sh(c, 'c04b-search-results');
  await c.goto(NC + '/voice'); await w(1500); await c.getByText('2 kg tomato, 1 litre milk, 1 dozen eggs').click(); await w(600); await sh(c, 'c05-voice', true);
  await c.getByTestId('add-parsed').click(); await w(1200);
  await c.goto(NC + '/category/med'); await w(2000); await c.getByTestId('add-p16').click().catch(() => {}); await c.getByTestId('add-p14').click().catch(() => {}); await w(400); await sh(c, 'c06-medicines');
  await db.doc('products/p10').update({ inStock: false }).catch(() => {}); // milk goes out of stock while in cart
  await c.goto(NC + '/cart'); await w(3000); await sh(c, 'c07-cart-split-stores-oos', true);
  await c.goto(NC + '/checkout'); await w(3000); await sh(c, 'c08-checkout-rx-locked', true);
  await c.getByTestId('place-reason').click().catch(() => {}); await w(900); await sh(c, 'c08b-checkout-scrolled-to-prescription');
  await db.doc('products/p10').update({ inStock: true }).catch(() => {});
  await c.goto(NC + '/rider'); await w(2000); await sh(c, 'c09-book-rider', true);
  await c.getByTestId('book').click(); await c.waitForURL(/order\/ER/, { timeout: 20000 }).catch(() => {}); await w(3000); await sh(c, 'c10-tracking-errand', true);
  // store-rejected + cancelled states
  const uid = (await db.collection('users').where('phone', '==', '+919000000001').get()).docs[0]?.id;
  const base = { type: 'order', customer: 'Demo', phone: '+919000000001', customerUid: uid, address: 'Porur', lines: [{ productId: 'p1', name: 'Tomato', qty: 2, price: 32 }], subtotal: 64, fee: 25, total: 89, pay: 'COD', paymentStatus: 'due', createdAt: new Date().toISOString() };
  await db.doc('orders/PD9901').set({ ...base, id: 'PD9901', storeId: 's1', status: 'rejected' });
  await db.doc('orders/PD9902').set({ ...base, id: 'PD9902', storeId: 's3', status: 'rejected', rxStatus: 'rejected', lines: [{ productId: 'p16', name: 'Amoxicillin', qty: 1, price: 95, rx: true }] });
  await c.goto(NC + '/order/PD9901'); await w(3000); await sh(c, 'c11-store-rejected');
  await c.goto(NC + '/order/PD9902'); await w(2500); await sh(c, 'c12-order-cancelled');
  await c.goto(NC + '/orders'); await w(2500); await sh(c, 'c13-orders', true);
  await c.goto(NC + '/settings'); await w(2000); await sh(c, 'c14-profile-settings-language');
  await c.goto(NC + '/credits'); await w(1500); await sh(c, 'c15-about-credits');
  await c.goto(NC + '/orders'); await w(2500); await c.context().setOffline(true); await w(500);
  await c.evaluate(() => window.dispatchEvent(new Event('offline'))).catch(() => {}); await w(800); await sh(c, 'c16-offline-banner'); await c.context().setOffline(false);
  // loading skeleton (fresh context, before auth resolves)
  const c2 = await mk(390, 844); await c2.goto(NC); await w(250); await sh(c2, 'c00-loading-skeleton'); await c2.context().close();
  // vendor
  const v = await mk(390, 844);
  await v.goto(NV); await login(v, '+919000000002', 'v01-login'); await v.waitForURL(/orders/, { timeout: 20000 }).catch(() => {}); await w(2500); await sh(v, 'v02-orders', true);
  await v.goto(NV + '/catalogue'); await w(2500); await sh(v, 'v03-items');
  await v.goto(NV + '/sales'); await w(2000); await sh(v, 'v04-sales', true);
  const v2 = await mk(390, 844); await v2.goto(NV); await login(v2, '+919000000003'); await w(2500); await sh(v2, 'v05-partner-access-request', true);
  // rider (prototype web)
  const r = await mk(390, 844); await r.goto(P + '#/rider/home'); await login(r, '+919000000004'); await w(3000);
  if (/Offline/.test(await r.textContent('.rhead').catch(() => ''))) { await r.locator('.rhead .pill').click(); await w(1500); }
  await sh(r, 'r01-on-duty-location-off-blocker', true);
  await r.locator('.rhead .pill').click(); await w(1500); await sh(r, 'r02-offline'); await r.locator('.rhead .pill').click(); await w(1000);
  // put an order on the way for Karthik to show the OTP step
  await db.doc('orders/PD9903').set({ ...base, id: 'PD9903', storeId: 's1', status: 'on_the_way', rider: 'r1' });
  await r.goto(P + '#/rider/home'); await w(3000); await r.locator('.rcard', { hasText: 'PD9903' }).scrollIntoViewIfNeeded().catch(() => {}); await sh(r, 'r03-delivery-otp-step', true);
  // prototype customer login + home (web)
  const pc = await mk(390, 844); await pc.goto(P + '#/customer/home'); await w(2500); await sh(pc, 'w01-web-login');
  // admin desktop
  const a = await mk(1440, 900, 1); await a.goto(P + '#/admin-desktop/overview'); await login(a, '+919000000000'); await w(4000); await sh(a, 'a01-admin-overview-breakeven', true);
  await a.goto(P + '#/admin-desktop/reports'); await w(2500); await sh(a, 'a02-admin-reports', true);
  await a.goto(P + '#/admin-desktop/orders'); await w(2500); await sh(a, 'a03-admin-orders');
  for (const id of ['PD9901', 'PD9902', 'PD9903']) await db.doc('orders/' + id).delete();
  console.log('page errors:', errs.length ? errs.slice(0, 5) : 'none'); await b.close();
})().catch(e => { console.error('SHOTS error:', e.message); process.exit(1); });
