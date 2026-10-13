// E2E: web customer -> vendor (native web export) -> admin desktop -> rider -> customer tracking, + settings & stock sync.
const { chromium } = require('/workspace/porur-prototype/node_modules/playwright');
const [P, NC, NV, TAG] = [process.env.PROTO || 'http://localhost:4173/', process.env.NCUST || 'http://localhost:8081', process.env.NVEND || 'http://localhost:8082', process.env.TAG || 'emu'];
const results = []; const ok = (n, c) => { results.push((c ? 'PASS ' : 'FAIL ') + n); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  const mk = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const shot = (p, n) => p.screenshot({ path: `screenshots/sync-${TAG}-${n}.png` });
  const admin = await mk(1440, 900), cust = await mk(390, 844), vend = await mk(390, 844), rider = await mk(390, 844), ncust = await mk(390, 844);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 1. Admin changes delivery fee -> customer apps
  await admin.goto(P + '#/admin-desktop/settings'); await admin.waitForSelector('.fld input'); await wait(1500);
  const fee = admin.locator('.fld input').first(); await fee.fill('30'); await wait(1500);
  // 2. Vendor (F&V) logs in
  await vend.goto(NV); await vend.getByTestId('store-s1').click(); await vend.getByTestId('login').click(); await wait(2500);
  // 3. Customer orders by typed "voice" text
  await cust.goto(P + '#/customer/voice'); await wait(1500);
  await cust.fill('textarea', '2 kg tomato, 5 kg rice'); await cust.getByText('Understand my order').click(); await cust.getByText(/Add 2 item/).click(); await wait(800);
  const cartTxt = await cust.textContent('.bill'); ok('admin fee change (₹30) applied in web customer cart', cartTxt.includes('₹30')); await shot(cust, '01-customer-cart-fee30');
  await cust.getByText('Proceed to checkout →').click(); await cust.getByText(/Place order/).click(); await cust.waitForURL(/track\/PD/, { timeout: 15000 });
  const id = cust.url().split('/').pop(); console.log('order', id);
  // 4. Vendor sees it live, accepts
  const accept = vend.getByTestId('accept-' + id); await accept.waitFor({ timeout: 15000 }); ok('order appears live in vendor app', true); await shot(vend, '02-vendor-new-order');
  await accept.click(); await wait(1500);
  // 5. Admin sees it as Accepted
  await admin.goto(P + '#/admin-desktop/orders'); await wait(2500);
  const col = await admin.locator('.kcol', { hasText: 'Accepted' }).textContent(); ok('admin board shows order under Accepted', col.includes(id)); await shot(admin, '03-admin-board-accepted');
  // 6. Vendor marks ready
  await vend.getByText('📦 Ready for pickup').first().click(); await wait(1500);
  // 7. Rider: picked up -> start trip -> OTP delivered
  await rider.goto(P + '#/rider/home'); await wait(2500);
  const card = rider.locator('.rcard', { hasText: id }); await card.waitFor({ timeout: 10000 }); ok('rider sees ready order', (await card.textContent()).includes('Ready')); await shot(rider, '04-rider-ready');
  await card.getByText('Picked up').click(); await wait(1200);
  let st = await cust.locator('[data-testid=steps] li.done').count(); ok('customer tracking shows Picked up (4 steps done)', st === 4);
  await card.getByText('Start trip').click(); await wait(1200);
  const otp = (await card.textContent()).match(/OTP is (\d{4})/)[1];
  await card.locator('input').fill(otp); await card.getByText('Delivered').click(); await wait(2000);
  const eta = await cust.textContent('.eta'); ok('customer tracking updates to Delivered', eta.includes('Delivered')); await shot(cust, '05-customer-tracking-delivered');
  await admin.goto(P + '#/admin-desktop/orders'); await wait(2000);
  ok('admin board shows Delivered', (await admin.locator('.kcol', { hasText: 'Delivered' }).textContent()).includes(id)); await shot(admin, '06-admin-delivered');
  // 8. Vendor stock toggle + price edit -> native customer app (web export)
  await vend.goto(NV + '/catalogue'); await wait(2500);
  await vend.getByRole('switch').first().click(); await wait(1500); // Tomato out of stock
  await ncust.goto(NC + '/category/fv'); await wait(3500);
  ok('vendor stock toggle shows "Out of stock" in native customer app', (await ncust.textContent('body')).includes('Out of stock')); await shot(ncust, '07-native-customer-out-of-stock');
  await ncust.getByTestId('add-p2').click(); await ncust.getByTestId('add-p5').click(); await ncust.goto(NC + '/cart'); await wait(2500);
  ok('admin fee (₹30) applied in native customer cart', (await ncust.textContent('body')).includes('₹30')); await shot(ncust, '08-native-customer-cart');
  await vend.getByRole('switch').first().click(); await admin.goto(P + '#/admin-desktop/settings'); await wait(1500); await admin.locator('.fld input').first().fill('25'); await wait(1000); // restore
  console.log(results.join('\n')); console.log('page errors:', errs.length ? errs : 'none'); await b.close();
})().catch(async e => { console.log(results.join('\n')); console.error('E2E error:', e.message); process.exit(1); });
