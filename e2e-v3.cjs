// v0.3 E2E: phone OTP login for every role, admin approves vendor/rider requests, order flow across apps, live map + rider GPS, notification toasts.
const { chromium } = require('/workspace/porur-prototype/node_modules/playwright');
const env = process.env;
const [P, NC, NV, TAG] = [env.PROTO || 'http://localhost:4173/', env.NCUST || 'http://localhost:8081', env.NVEND || 'http://localhost:8082', env.TAG || 'emu-v3'];
const LIVE = !!env.LIVE; const Q = LIVE ? '?test=1' : '';
const PH = { admin: env.ADMIN || '+919000000000', cust: env.CUST || '+919000000001', vend: env.VEND || '+919000000002', rider: env.RIDER || '+919000000004' };
const LIVECODE = { '+919000000000': '000000', '+919000000001': '111111', '+919000000002': '222222', '+919000000003': '333333', '+919000000004': '444444' };
const results = []; const ok = (n, c) => { results.push((c ? 'PASS ' : 'FAIL ') + n); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function codeFor(phone) {
  if (LIVE) return LIVECODE[phone];
  for (let i = 0; i < 20; i++) { const j = await (await fetch('http://localhost:9099/emulator/v1/projects/demo-porur/verificationCodes')).json();
    const c = (j.verificationCodes || []).filter(v => v.phoneNumber === phone).pop(); if (c) return c.code; await wait(300); }
}
(async () => {
  if (!LIVE) await fetch('http://localhost:9099/emulator/v1/projects/demo-porur/verificationCodes', { method: 'DELETE' }).catch(() => {});
  const b = await chromium.launch(); const errs = [];
  const mk = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const shot = (p, n) => p.screenshot({ path: `screenshots/sync-${TAG}-${n}.png` });
  const login = async (p, phone) => { const f = p.getByTestId('phone'); await f.waitFor({ timeout: 20000 }); await f.fill(phone); await p.getByTestId('send-code').click();
    await p.getByTestId('otp').waitFor({ timeout: 20000 }); await p.getByTestId('otp').fill(await codeFor(phone)); await p.getByTestId('verify').click(); await wait(3000); };
  const admin = await mk(1440, 900), cust = await mk(390, 844), vend = await mk(390, 844), rider = await mk(390, 844), ncust = await mk(390, 844);

  // 1. Logins
  await admin.goto(P + Q + '#/admin-desktop/users'); await shot(admin, '00-login'); await login(admin, PH.admin);
  ok('admin signs in by phone OTP and sees Users & Access', /Users & Access/.test(await admin.textContent('body')));
  await vend.goto(NV + Q); await login(vend, PH.vend);
  const rq = vend.getByTestId('request-vendor');
  if (await rq.isVisible().catch(() => false)) { await vend.getByTestId('req-name').fill('Murugan'); await vend.getByTestId('store-s1').click(); await rq.click();
    await vend.getByTestId('pending').waitFor({ timeout: 10000 }); ok('vendor without role sees request → pending screen', true); await shot(vend, '01-vendor-pending');
    await admin.getByTestId('approve-' + PH.vend).click({ timeout: 15000 }); await wait(3000); }
  await vend.waitForURL(/orders/, { timeout: 15000 }).catch(() => {}); ok('vendor approved by admin → enters store s1 dashboard', /orders/.test(vend.url()));
  await rider.goto(P + Q + '#/rider/home'); await login(rider, PH.rider);
  const rr = rider.getByTestId('request-rider');
  if (await rr.isVisible().catch(() => false)) { await rr.click(); await wait(1500); await admin.getByTestId('approve-' + PH.rider).click({ timeout: 15000 }); await wait(3000); }
  ok('rider approved → rider view with GPS controls', await rider.getByTestId('gps-share').isVisible({ timeout: 10000 }).catch(() => false)); await shot(admin, '02-admin-users');
  await cust.goto(P + Q + '#/customer/voice'); await login(cust, PH.cust);
  const staff = await (await mk(390, 844)); // customer must NOT see admin
  // 2. Customer orders
  await cust.goto(P + Q + '#/customer/voice'); await wait(1500);
  await cust.fill('textarea', '2 kg tomato, 5 kg rice'); await cust.getByText('Understand my order').click(); await cust.getByText(/Add 2 item/).click(); await wait(800);
  await cust.getByText('Proceed to checkout →').click(); await cust.getByText(/Place order/).click(); await cust.waitForURL(/track\/PD/, { timeout: 15000 });
  const id = cust.url().split('/').pop(); console.log('order', id);
  // 3. Vendor accepts + ready
  const accept = vend.getByTestId('accept-' + id); await accept.waitFor({ timeout: 15000 }); ok('order appears live in vendor app', true); await shot(vend, '03-vendor-new-order');
  await accept.click(); await wait(2000);
  ok('customer gets notification toast on status change', await cust.getByTestId('toast').isVisible().catch(() => false)); await shot(cust, '04-customer-toast');
  await vend.getByText('📦 Ready for pickup').first().click(); await wait(2000);
  // 4. Rider picks up, simulates GPS drive, delivers
  const card = rider.locator('.rcard', { hasText: id }); await card.waitFor({ timeout: 15000 }); ok('rider sees ready order', true);
  await card.getByText('Picked up').click(); await wait(1200); await card.getByText('Start trip').click(); await wait(1200);
  await rider.getByTestId('gps-sim').click(); await wait(5000); await shot(rider, '05-rider-gps');
  const tb = await cust.textContent('body'); ok('customer tracking shows live rider location', /Rider location updated/.test(tb));
  ok('customer tracking renders Leaflet map with rider marker', (await cust.locator('.leaflet-marker-icon').count()) >= 3); await shot(cust, '06-customer-map');
  const otp = (await card.textContent()).match(/OTP is (\d{4})/)[1];
  await card.locator('input').fill(otp); await card.getByText('Delivered').click(); await wait(2500);
  ok('customer tracking updates to Delivered', (await cust.textContent('.eta')).includes('Delivered')); await shot(cust, '07-customer-delivered');
  await admin.goto(P + Q + '#/admin-desktop/orders'); await wait(3000);
  ok('admin board shows Delivered', (await admin.locator('.kcol', { hasText: 'Delivered' }).textContent()).includes(id)); await shot(admin, '08-admin-delivered');
  await admin.goto(P + Q + '#/admin-desktop/overview'); await wait(3000); ok('admin zone map renders (Leaflet)', (await admin.locator('.leaflet-container').count()) > 0); await shot(admin, '09-admin-map');
  // 5. Customer cannot open admin
  await cust.goto(P + Q + '#/admin-desktop/orders'); await wait(2500); ok('customer blocked from admin dashboard', /Admin only/i.test(await cust.textContent('body')));
  // 6. Native customer app (web export): login + tracking map
  await ncust.goto(NC + Q); await login(ncust, PH.cust); await ncust.goto(NC + '/order/' + id); await wait(4000);
  ok('native customer app (phone login) shows order + map', (await ncust.textContent('body')).includes('Delivery OTP') && (await ncust.locator('iframe').count()) > 0); await shot(ncust, '10-native-tracking');
  console.log(results.join('\n')); console.log('page errors:', errs.length ? errs : 'none'); await b.close();
})().catch(async e => { console.log(results.join('\n')); console.error('E2E error:', e.message); process.exit(1); });
