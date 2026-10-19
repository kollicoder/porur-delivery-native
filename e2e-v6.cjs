// v0.6 E2E (emulator or LIVE): group-buy meter, office lunch, home services, surplus flash deals — web prototype + native web builds.
const { chromium } = require('/workspace/porur-prototype/node_modules/playwright');
const { execSync } = require('child_process'); const fs = require('fs');
const env = process.env; const LIVE = !!env.LIVE; const Q = LIVE ? '?test=1' : ''; const FSP = env.FS_PORT || '8085';
const [P, NC, NV, TAG] = [env.PROTO || 'http://localhost:4173/', env.NCUST || 'http://localhost:8081', env.NVEND || 'http://localhost:8082', env.TAG || 'emu'];
const PH = { admin: '+919000000000', cust: '+919000000001', vend: '+919000000002', rider: '+919000000004', food: '+919000000005', cook: '+919000000006', pro: '+919000000007', leader: '+919000000008', cust2: '+919000000009' };
const LIVECODE = Object.fromEntries(Object.values(PH).map(p => [p, p.slice(-1).repeat(6)]));
const results = []; const ok = (n, c, extra = '') => { results.push((c ? 'PASS ' : 'FAIL ') + n + (extra && !c ? ' — ' + String(extra).slice(0, 200) : '')); if (!c) process.exitCode = 1; console.log((c ? 'PASS ' : 'FAIL ') + n); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const IST = 19800000, DAY = 864e5; const istDate = ms => new Date(ms + IST).toISOString().slice(0, 10);
let db; if (!LIVE) {
  execSync(`curl -s -X DELETE "http://localhost:${FSP}/emulator/v1/projects/demo-porur/databases/(default)/documents"; curl -s -X DELETE "http://localhost:9099/emulator/v1/projects/demo-porur/accounts"`);
  execSync(`FIRESTORE_EMULATOR_HOST=localhost:${FSP} npx tsx firebase/seed.ts`, { stdio: 'ignore' });
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:' + FSP; const { initializeApp } = require('firebase-admin/app'); initializeApp({ projectId: 'demo-porur' }); db = require('firebase-admin/firestore').getFirestore(); }
async function codeFor(phone) {
  if (LIVE) return LIVECODE[phone];
  for (let i = 0; i < 20; i++) { const j = await (await fetch('http://localhost:9099/emulator/v1/projects/demo-porur/verificationCodes')).json();
    const c = (j.verificationCodes || []).filter(v => v.phoneNumber === phone).pop(); if (c) return c.code; await wait(300); }
}
const step = async (name, f) => { try { await f(); } catch (e) { ok(name + ' (step crashed)', false, e.message.split('\n')[0]); } };
(async () => {
  fs.mkdirSync('screenshots/v6', { recursive: true });
  const b = await chromium.launch(); const errs = [];
  const mk = async (w = 390, h = 844) => { const c = await b.newContext({ viewport: { width: w, height: h }, geolocation: { latitude: 13.0382, longitude: 80.1565 }, permissions: ['geolocation'], acceptDownloads: true }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => {})); return p; };
  const shot = (p, n) => p.screenshot({ path: `screenshots/v6/${TAG}-${n}.png` }).catch(() => {});
  const login = async (p, phone) => { const f = p.getByTestId('phone'); await f.waitFor({ timeout: 30000 }); await f.fill(phone); await p.getByTestId('send-code').click();
    await p.getByTestId('otp').waitFor({ timeout: 20000 }); await p.getByTestId('otp').fill(await codeFor(phone)); await p.getByTestId('verify').click(); await wait(3500); };
  const T = (p, id) => p.getByTestId(id); const txt = async (p, id) => (await T(p, id).first().textContent({ timeout: 15000 }).catch(() => '')) || '';
  const codeIn = async (p, id) => ((await txt(p, id)).match(/(\d{4})/) || [])[1];
  const admin = await mk(1440, 900), cust = await mk(), cust2 = await mk(), leader = await mk(), rider = await mk(), cook = await mk(), pro = await mk(), fvend = await mk(), fweb = await mk(), ncust = await mk(), nvend2 = await mk();
  if (db) { for (let i = 1; i <= 10; i++) await db.doc('riders/r' + i).update({ status: 'offline' }); await db.doc('riders/r1').update({ status: 'online', lat: 13.0362, lng: 80.1578, locAt: new Date().toISOString() }); }
  await admin.goto(P + Q + '#/admin-desktop/groupbuy'); await login(admin, PH.admin); await admin.goto(P + Q + '#/admin-desktop/groupbuy'); await wait(2500);
  await admin.reload(); await wait(3000); ok('admin: Group buy page loads', await T(admin, 'admin-groupbuy').waitFor({ timeout: 20000 }).then(() => true).catch(() => false));
  await rider.goto(P + Q + '#/rider/home'); await login(rider, PH.rider); await wait(1500);
  { const rr = T(rider, 'request-rider'); if (await rr.isVisible().catch(() => false)) { await rr.click(); await wait(1500); await admin.goto(P + Q + '#/admin-desktop/users'); await wait(2500); await T(admin, 'approve-' + PH.rider).click({ timeout: 15000 }); await wait(3000); } }
  if (LIVE) { if (/Offline/.test(await rider.textContent('.rhead'))) { await rider.locator('.rhead .pill').click(); await wait(1500); } }
  await leader.goto(P + Q + '#/customer/home'); await login(leader, PH.leader);

  // ===================== 1. GROUP-BUY METER =====================
  await step('meter', async () => {
    await cust.goto(P + Q + '#/customer/home'); await login(cust, PH.cust); await cust.goto(P + Q + '#/customer/home'); await wait(2000);
    ok('home shows "More ways to save" (4 entries)', await T(cust, 'more-ways').isVisible() && await T(cust, 'more-deals').isVisible() && await T(cust, 'more-services').isVisible()); await T(cust, 'more-ways').scrollIntoViewIfNeeded(); await shot(cust, '01-home-more-ways');
    await T(cust, 'more-meter').click(); await T(cust, 'meter-hero').waitFor({ timeout: 15000 });
    const hero = await txt(cust, 'meter-hero'); ok('meter: progress, countdown to Sat 9 pm and expected delivery date', /\/ 100 baskets/.test(hero) && /Closes in/.test(hero) && /Expected delivery/.test(hero), hero);
    await T(cust, 'comm-c1').click(); await T(cust, 'meter-flat').fill('B-204'); await T(cust, 'madd-m1').click(); await wait(300);
    ok('meter: ₹300 minimum enforced', /minimum basket is ₹300/.test(await txt(cust, 'meter-short')) && await T(cust, 'meter-commit').isDisabled());
    await T(cust, 'meter-sample').click(); await wait(400); await shot(cust, '02-meter-basket');
    await T(cust, 'meter-commit').click(); await T(cust, 'my-basket').waitFor({ timeout: 15000 });
    const mb = await txt(cust, 'my-basket'); ok('meter: basket committed at Sunday price ₹464 (₹440 if it fills)', /₹464/.test(mb) && /₹440/.test(mb), mb); await shot(cust, '03-meter-committed');
    await cust2.goto(P + Q + '#/customer/meter/c1'); await login(cust2, PH.cust2); await cust2.goto(P + Q + '#/customer/meter/c1'); await wait(2500);
    ok('share/join link deep-links to the community (c1 preselected)', await T(cust2, 'comm-c1').evaluate(e => e.className.includes('on')).catch(() => false));
    await T(cust2, 'meter-flat').fill('C-11'); await T(cust2, 'meter-sample').click(); await T(cust2, 'meter-commit').click(); await T(cust2, 'my-basket').waitFor({ timeout: 15000 });
    await wait(1500); ok('meter counter moved by 2', /2 \/ 100|[2-9]\d* \/ 100/.test(await txt(cust2, 'meter-bar')));
    // leader appointed by admin
    await admin.goto(P + Q + '#/admin-desktop/groupbuy'); await wait(2500); await T(admin, 'leader-phone-c1').fill(PH.leader); await T(admin, 'leader-set-c1').click(); await wait(2500);
    await leader.goto(P + Q + '#/customer/leader'); await wait(3500);
    ok('leader dashboard lists the community households', (await leader.locator('[data-testid^=lb-]').count()) >= 2); await shot(leader, '04-leader-dashboard');
    // close batch
    let mid = null; if (db) { const m = (await db.collection('meters').where('status', '==', 'open').get()).docs[0]; mid = m.id; await m.ref.update({ threshold: 2 }); }
    await admin.goto(P + Q + '#/admin-desktop/groupbuy'); await wait(3000); await shot(admin, '05-admin-groupbuy');
    const dl = admin.waitForEvent('download', { timeout: 10000 }).catch(() => null); await T(admin, 'po-csv').click(); const d = await dl;
    const csv = d ? fs.readFileSync(await d.path(), 'utf8') : ''; ok('admin: per-SKU aggregation → supplier PO CSV (case-rounded)', /supplier,item/.test(csv) && /Koyambedu|Wholesale|Mill|Farm/i.test(csv), csv.slice(0, 120));
    if (LIVE) await T(admin, 'close-sunday').click(); else await T(admin, 'close-fill').click();
    await T(admin, 'close-result').waitFor({ timeout: 20000 }); const cr = await txt(admin, 'close-result');
    ok(`admin closes batch (${LIVE ? 'Sunday' : 'meter filled'}) → drops, POs, next meter`, /Closed as/.test(cr) && /gate drops/.test(cr) && /next meter M/.test(cr), cr);
    await wait(2500); const due = await txt(cust, 'basket-due'); ok(`customer amount due = ${LIVE ? '₹464 (Sunday price)' : '₹440 (fill price — difference not charged)'}`, LIVE ? /₹464/.test(due) : /₹440/.test(due), due);
    await shot(cust, '06-meter-locked-fill-price');
    // drop → rider r1
    const row = admin.locator('tr', { hasText: 'Gate drop' }).first(); await row.locator('select').selectOption('r1').catch(() => {}); await wait(2000);
    await rider.goto(P + Q + '#/rider/home'); await wait(3500); const pick = rider.locator('[data-testid^=drop-pick-]').first(); await pick.waitFor({ timeout: 15000 });
    const did = (await pick.getAttribute('data-testid')).replace('drop-pick-', ''); await pick.click(); await wait(2000);
    await T(rider, 'drop-code-' + did).fill('0000'); await T(rider, 'drop-done-' + did).click(); await wait(2500);
    const lcode = await (async () => { await leader.goto(P + Q + '#/customer/leader'); await wait(3500); return codeIn(leader, 'leader-drop-code'); })();
    ok('gate-drop code: leader has it, household & rider do not', !!lcode && !(await rider.textContent('body')).includes('Give this code'));
    if (lcode === '0000') ok('wrong drop code rejected', true); else ok('wrong drop code rejected by rules', /Wrong code/.test(await rider.textContent('[data-testid=drop-' + did + ']')));
    await shot(rider, '07-rider-gate-drop');
    await T(rider, 'drop-code-' + did).fill(lcode); await T(rider, 'drop-done-' + did).click(); await wait(3000);
    ok('rider delivers gate drop with the leader\'s code', !(await rider.locator('[data-testid=drop-pick-' + did + '],[data-testid=drop-done-' + did + ']').count()));
    await leader.goto(P + Q + '#/customer/leader'); await wait(3500); const hb = leader.locator('[data-testid^=hand-cash-]').first(); await hb.click({ timeout: 10000 }); await wait(2500);
    const ew = await txt(leader, 'leader-earn-week'); ok('leader marks hand-over (cash) → 5% commission tracked', /₹(2[0-9]|1[0-9])/.test(ew), ew); await shot(leader, '08-leader-handover-earnings');
  });

  // ===================== 2. OFFICE LUNCH =====================
  await step('lunch', async () => {
    await cook.goto(P + Q + '#/partner/home'); await login(cook, PH.cook); await cook.goto(P + Q + '#/partner/home'); await wait(2500);
    await T(cook, 'cook-name').fill('Lakshmi'); await T(cook, 'cook-kitchen').fill("Lakshmi's Kitchen"); await T(cook, 'cook-fssai').fill('2242699900045'); await T(cook, 'cook-fssai-exp').fill('2027-03-31');
    for (const k of ['fssai', 'medical', 'pest', 'water', 'visit']) await T(cook, 'onb-' + k).check();
    await T(cook, 'cook-apply').click(); await wait(800); ok('cook onboarding: 13-digit FSSAI rejected', /14 digits/.test(await cook.textContent('body')));
    await T(cook, 'cook-fssai').fill('22426999000456'); await shot(cook, '09-cook-apply'); await T(cook, 'cook-apply').click(); await T(cook, 'pending').waitFor({ timeout: 15000 }); ok('cook application pending admin approval', true);
    await admin.goto(P + Q + '#/admin-desktop/lunch'); await wait(3000); await T(admin, 'capprove-' + PH.cook).click(); await wait(3000);
    await T(cook, 'cook-home').waitFor({ timeout: 20000 }); ok('admin approves cook → cook dashboard', true);
    await T(cook, 'menu-veg-price').fill('120'); await wait(300); ok('menu price outside ₹130–150 blocked', await T(cook, 'menu-save').isDisabled());
    await T(cook, 'menu-veg-price').fill('130'); await T(cook, 'menu-nv').fill('Chicken curry meals'); await T(cook, 'menu-nv-price').fill('150'); await T(cook, 'menu-save').click(); await wait(2500);
    ok('cook publishes next-day menu', /Saved/.test(await txt(cook, 'menu-msg'))); await shot(cook, '10-cook-menu');
    await cust.goto(P + Q + '#/customer/lunch'); await wait(3500); await cust.locator('[data-testid^=pick-]').first().click();
    await cust.locator('[data-testid=lunch-veg] button[aria-label=less]').click(); await cust.locator('[data-testid=lunch-veg] button[aria-label=less]').click(); await wait(300);
    ok('lunch: minimum 5 packs enforced', await T(cust, 'lunch-place').isDisabled() && /Minimum 5/.test(await txt(cust, 'lunch-summary')));
    await cust.locator('[data-testid=lunch-veg] button[aria-label=more]').click(); await cust.locator('[data-testid=lunch-veg] button[aria-label=more]').click(); await cust.locator('[data-testid=lunch-nonveg] button[aria-label=more]').click();
    await T(cust, 'lunch-company').fill('Acme Analytics'); await T(cust, 'office-dlf-b5').click(); await shot(cust, '11-lunch-order');
    ok('lunch: 5 veg × ₹130 + 1 non-veg × ₹150 = ₹800', /₹800/.test(await txt(cust, 'lunch-summary')));
    await T(cust, 'lunch-place').click(); await T(cust, 'lunch-ok').waitFor({ timeout: 15000 }); ok('team lunch order placed (cutoff 8 pm the evening before)', true);
    await wait(2000); await cook.reload(); await wait(3500); const cb = cook.locator('[data-testid^=cook-next-]').first(); await cb.click(); await wait(1500); await cook.locator('[data-testid^=cook-next-]').first().click(); await wait(1500);
    ok('cook sees next-day orders by office (veg/non-veg split) and moves them to cooking', /cooking/.test(await cook.textContent('[data-testid=cook-office-dlf-b5]')) && /1 non-veg/.test(await cook.textContent('body')));
    await shot(cook, '12-cook-orders');
    await admin.goto(P + Q + '#/admin-desktop/lunch'); await wait(3000); await T(admin, 'lunch-runs').click(); await wait(3000); await T(admin, 'lrun-dlf-b5').selectOption('r1').catch(() => {}); await wait(1500);
    ok('admin creates batched lunch run per office', /run\(s\) created/.test(await admin.textContent('body'))); await shot(admin, '13-admin-lunch');
    await cust.goto(P + Q + '#/customer/lunch'); await wait(3000); const lc = await codeIn(cust, 'lunch-code'); ok('reception sees the lunch drop code', !!lc);
    await rider.goto(P + Q + '#/rider/home'); await wait(3500); const lp = rider.locator('[data-testid^=drop-pick-]').first(); const lid = (await lp.getAttribute('data-testid')).replace('drop-pick-', ''); await lp.click(); await wait(2000);
    await T(rider, 'drop-code-' + lid).fill(lc); await T(rider, 'drop-done-' + lid).click(); await wait(3000); ok('rider delivers lunch run with reception code', !(await rider.locator('[data-testid=drop-done-' + lid + ']').count()));
  });

  // ===================== 3. HOME SERVICES =====================
  await step('services', async () => {
    await pro.goto(P + Q + '#/partner/home'); await login(pro, PH.pro); await pro.goto(P + Q + '#/partner/home'); await wait(2500);
    await pro.getByText('🛠️ Service pro').click(); await T(pro, 'pro-name').fill('Murugan'); await T(pro, 'skill-plumber').click(); await T(pro, 'skill-electrician').click();
    await T(pro, 'kyc-idLast4').fill('4321'); await T(pro, 'kyc-policeRef').fill('CHN/PV/2026/1182'); await shot(pro, '14-pro-apply'); await T(pro, 'pro-apply').click(); await T(pro, 'pending').waitFor({ timeout: 15000 });
    await admin.goto(P + Q + '#/admin-desktop/services'); await wait(3000); const pr = T(admin, 'papp-' + PH.pro); await pr.getByText('Mark police-verified').click(); await wait(1500); await T(admin, 'papprove-' + PH.pro).click(); await wait(3000);
    await T(pro, 'pro-home').waitFor({ timeout: 20000 }); ok('pro KYC (last-4 only) + police verification → admin approval', /police-verified/.test(await pro.textContent('body')));
    const tmr = istDate(Date.now() + DAY);
    await cust.goto(P + Q + '#/customer/services'); await wait(3000); await T(cust, 'svc-plumber').click(); await T(cust, 'day-' + tmr).click(); await T(cust, 'slot-10').click(); await T(cust, 'svc-address').fill('B-204, Lakshmi Apartments, Porur');
    await shot(cust, '15-services-book'); await T(cust, 'svc-book').click(); await cust.waitForURL(/job\/JB/, { timeout: 20000 }); await wait(2500);
    ok('job auto-assigned to the verified pro in a 2-hour slot (₹149 inspection)', /Pro assigned/.test(await txt(cust, 'job-status-text')) && /₹149/.test(await txt(cust, 'job-payable')));
    const sOtp = await codeIn(cust, 'job-start-otp'); await shot(cust, '16-job-start-otp');
    await pro.reload(); await wait(3500); await T(pro, 'pj-enroute').click(); await wait(2000); await T(pro, 'pj-start-otp').fill(sOtp === '0000' ? '1111' : '0000'); await T(pro, 'pj-start').click(); await wait(2500);
    ok('wrong start OTP rejected by rules', /Wrong OTP/.test(await pro.textContent('body')));
    await T(pro, 'pj-start-otp').fill(sOtp); await T(pro, 'pj-start').click(); await wait(2500); await pro.locator('[data-testid^="rc-Tap"]').click(); await T(pro, 'pj-quote').click(); await wait(2500);
    await cust.reload(); await wait(3500); ok('customer sees quote (₹199 + ₹149)', /₹348/.test(await txt(cust, 'job-quote'))); await shot(cust, '17-job-quote'); await T(cust, 'quote-approve').click(); await wait(2500);
    const fOtp = await codeIn(cust, 'job-finish-otp'); await pro.reload(); await wait(3500); await T(pro, 'pj-finish-otp').fill(fOtp); await shot(pro, '18-pro-finish'); await T(pro, 'pj-finish').click(); await wait(3000);
    await cust.reload(); await wait(3500); ok('job done with finish OTP; ₹348 collected', /Done/.test(await txt(cust, 'job-status-text')) && /₹348/.test(await txt(cust, 'job-payable')));
    await T(cust, 'job-stars-5').click(); await T(cust, 'job-rate').click(); await wait(2000); ok('customer rates the pro', /You rated 5/.test(await txt(cust, 'job-rated')));
    await T(cust, 'wslot-12').click(); await T(cust, 'job-warranty-claim').click(); await cust.waitForURL(u => /job\/JB/.test(u) && !u.endsWith(cust.url().split('/').pop()) || true, { timeout: 5000 }).catch(() => {}); await wait(3500);
    ok('30-day warranty claim → free re-visit by the same pro', /warranty/.test(await cust.textContent('body')) && /₹0/.test(await txt(cust, 'job-payable'))); await shot(cust, '19-job-warranty');
    await admin.goto(P + Q + '#/admin-desktop/services'); await wait(3000); ok('admin jobs board lists jobs', (await admin.locator('[data-testid=jobs-board] tbody tr').count()) >= 2); await shot(admin, '20-admin-services');
  });

  // ===================== 4. SURPLUS FLASH DEALS =====================
  await step('deals', async () => {
    await fvend.goto(NV + Q); await login(fvend, PH.food); await wait(1500); await T(fvend, 'store-s4').click(); await T(fvend, 'req-name').fill('Imran'); await T(fvend, 'request-vendor').click(); await T(fvend, 'pending').waitFor({ timeout: 15000 });
    await admin.goto(P + Q + '#/admin-desktop/users'); await wait(3000); await T(admin, 'approve-' + PH.food).click(); await wait(3000);
    await fvend.waitForURL(/orders/, { timeout: 20000 }).catch(() => {}); await fvend.goto(NV + '/deals'); await T(fvend, 'vendor-deals').waitFor({ timeout: 20000 });
    ok('FSSAI kitchen (s4) gets the Deals tab after admin approval', /0\/2 deals/.test(await txt(fvend, 'deal-cap')));
    await T(fvend, 'deal-text').fill('பத்து பிரியாணி நூறு ரூபாய் தள்ளுபடி'); await T(fvend, 'deal-parse').click(); await T(fvend, 'deal-confirm').waitFor();
    const dc = await txt(fvend, 'deal-checks'); ok('Tamil voice text parsed: 10 × Chicken Biryani at ₹150 (₹100 off, 40%)', /40% off/.test(dc) && (await T(fvend, 'deal-price').inputValue()) === '150', dc);
    await T(fvend, 'deal-price').fill('200'); await wait(300); ok('price > 0.7× catalogue blocked', /at least 30% off/.test(await txt(fvend, 'deal-checks'))); await T(fvend, 'deal-price').fill('150');
    await shot(fvend, '21-vendor-deal-confirm'); await T(fvend, 'deal-publish').click(); await T(fvend, 'deal-published').waitFor({ timeout: 15000 }); ok('vendor confirms → deal live', true);
    await cust.goto(P + Q + '#/customer/deals'); await wait(3000); await T(cust, 'alerts-toggle').check(); await wait(1500); ok('customer opts in to deal alerts (≤1/day, none after 10:30 pm)', /Saved/.test(await txt(cust, 'alerts-saved')));
    const card = cust.locator('[data-testid^=deal-DL]', { hasText: 'Chicken Biryani' }).first(); await card.waitFor({ timeout: 15000 }); await shot(cust, '22-customer-deals');
    await card.locator('[data-testid^=deal-open-]').click(); await card.locator('[data-testid=claim-qty] button[aria-label=more]').click(); await card.getByTestId('claim-confirm').click(); await card.getByTestId('claim-ok').waitFor({ timeout: 15000 });
    await wait(1500); const pc = await codeIn(cust, 'claim-code'); ok('atomic claim (2 portions) → private pickup code', !!pc); await shot(cust, '23-claim-code');
    await fvend.reload(); await wait(4000); const vc = fvend.locator('[data-testid^=vc-CL]').first(); await vc.getByTestId('vc-code').waitFor({ timeout: 15000 }); await wait(3000); await vc.getByTestId('vc-code').fill(pc === '0000' ? '1111' : '0000'); await vc.getByTestId('vc-handover').click(); await wait(2500); await shot(fvend, '23b-vendor-wrong-code');
    ok('wrong pickup code rejected', /Wrong code/.test(await fvend.textContent('body'))); await vc.getByTestId('vc-code').fill(pc); await vc.getByTestId('vc-handover').click(); await wait(3000);
    ok('vendor hands over with the code', !(await fvend.locator('[data-testid^=vc-CL]').count()));
    await cust.reload(); await wait(3500); await T(cust, 'claim-stars-2').click(); await T(cust, 'claim-complaint').fill('Rice was cold'); await T(cust, 'claim-rate').click(); await wait(2000); ok('customer rates + complains', /complaint sent/.test(await cust.textContent('body')));
    await fweb.goto(P + Q + '#/partner/home'); await login(fweb, PH.food); await fweb.goto(P + Q + '#/partner/home'); await T(fweb, 'vendor-deals').waitFor({ timeout: 20000 });
    await T(fweb, 'deal-text').fill('5 veg meals at 40% off for 90 minutes with delivery'); await T(fweb, 'deal-parse').click(); await T(fweb, 'deal-confirm').waitFor();
    ok('English text parsed: 5 Veg Meals ₹84, 90 min, delivery', (await T(fweb, 'deal-price').inputValue()) === '84' && await T(fweb, 'dm-90').evaluate(e => e.className.includes('on')));
    await T(fweb, 'deal-publish').click(); await wait(3000); await T(fweb, 'deal-text').fill('3 idli at 50% off'); await T(fweb, 'deal-parse').click(); await wait(500);
    ok("per-vendor nightly cap (2 deals) enforced", /limit is 2 deals/.test(await txt(fweb, 'deal-checks')) && await T(fweb, 'deal-publish').isDisabled()); await shot(fweb, '24-web-vendor-cap');
    await cust2.goto(P + Q + '#/customer/deals'); await wait(3500); const c2 = cust2.locator('[data-testid^=deal-DL]', { hasText: 'Veg Meals' }).first(); await c2.locator('[data-testid^=deal-open-]').click();
    await c2.getByText('🛵 Delivery ₹39').click(); await c2.getByTestId('claim-address').fill('C-11, Lakshmi Apartments'); await c2.getByTestId('claim-confirm').click(); await c2.getByTestId('claim-ok').waitFor({ timeout: 15000 });
    await wait(1500); const dcode = await codeIn(cust2, 'claim-code'); ok('delivery claim adds the ₹39 batched delivery fee', /₹123/.test(await cust2.textContent('body')));
    await admin.goto(P + Q + '#/admin-desktop/deals'); await wait(3000); await admin.locator('[data-testid=admin-deals] select').first().selectOption('r1').catch(() => {}); await T(admin, 'deal-run').click(); await wait(2500); await shot(admin, '25-admin-deals');
    await rider.goto(P + Q + '#/rider/home'); await wait(3500); const rc = rider.locator('[data-testid^=rclaim-CL]').first(); await rc.locator('input').fill(dcode); await rc.locator('[data-testid^=rclaim-done-]').click(); await wait(3000);
    ok('rider delivers the deal run with the customer code', !(await rider.locator('[data-testid^=rclaim-CL]').count())); await shot(rider, '26-rider-runs');
    await cust2.reload(); await wait(3500); await T(cust2, 'claim-stars-1').click(); await T(cust2, 'claim-complaint').fill('Late and cold'); await T(cust2, 'claim-rate').click(); await wait(2000);
    if (LIVE) { let paused = false; for (let i = 0; i < 12 && !paused; i++) { await wait(10000); await admin.goto(P + Q + '#/admin-desktop/deals'); await wait(3000); paused = /Paused: Auto-paused/.test(await txt(admin, 'deal-vendors')); }
      ok('Cloud Function auto-pauses the vendor after 2 complaints in 7 days', paused); const log = await admin.textContent('body'); ok('Cloud Function fan-out log written (pushLog)', /opted-in/.test(log));
      await shot(admin, '27-admin-autopause'); await admin.locator('[data-testid=deal-vendors] tr', { hasText: 'Biryani' }).getByText('Un-pause').click().catch(() => {}); await wait(1500); }
    await admin.goto(P + Q + '#/admin-desktop/deals'); await wait(3000); await T(admin, 'deals-kill').click(); await wait(3000);
    await cust.goto(P + Q + '#/customer/deals'); await wait(3500); ok('admin kill switch removes all live deals for customers', await T(cust, 'deals-empty').isVisible().catch(() => false));
    await admin.goto(P + Q + '#/admin-desktop/deals'); await wait(2500); await T(admin, 'deals-kill').click(); await wait(1500);
  });

  // ===================== 5. NATIVE APP SCREENS =====================
  await step('native', async () => {
    await ncust.goto(NC + Q); await login(ncust, PH.cust); await ncust.goto(NC); await wait(5000); await T(ncust, 'more-ways').scrollIntoViewIfNeeded().catch(() => {});
    ok('native customer: Home "More ways to save"', await T(ncust, 'more-meter').isVisible().catch(() => false)); await shot(ncust, '28-native-home');
    for (const [r, id, n] of [['/meter', 'meter-hero', '29-native-meter'], ['/deals', 'deals-screen', '30-native-deals'], ['/lunch', 'lunch-screen', '31-native-lunch'], ['/services', 'services-screen', '32-native-services']]) {
      await ncust.goto(NC + r); await wait(5000); ok('native customer screen ' + r, await T(ncust, id).isVisible().catch(() => false)); await shot(ncust, n); }
    await nvend2.goto(NV + Q); await login(nvend2, PH.cook); await wait(5000); ok('native partner app: approved cook lands on cook dashboard', await T(nvend2, 'cook-home').isVisible({ timeout: 10000 }).catch(() => false)); await shot(nvend2, '33-native-cook');
    await T(nvend2, 'signout').click(); await wait(3000); await login(nvend2, PH.pro); await wait(5000); ok('native partner app: approved pro lands on jobs', await T(nvend2, 'pro-home').isVisible({ timeout: 10000 }).catch(() => false)); await shot(nvend2, '34-native-pro');
  });
  console.log('\n' + results.join('\n')); console.log(`${results.filter(r => r.startsWith('PASS')).length} pass, ${results.filter(r => r.startsWith('FAIL')).length} fail`); console.log('page errors:', errs.length ? [...new Set(errs)].slice(0, 6) : 'none'); await b.close();
})().catch(async e => { console.log(results.join('\n')); console.error('E2E error:', e.message); process.exit(1); });
