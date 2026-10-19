/**
 * v0.6 "new models" — pure logic shared by the native apps, the web prototype (transpiled copy: porur-prototype/src/models.js),
 * the Firestore rules tests and the Cloud Function. NO React / Firebase imports here.
 *  1. Group-buy Meter (fill-or-Sunday)   2. Office lunch bulk orders   3. Home services   4. Surplus flash deals
 * Every money figure is an ESTIMATE from the New Models report (Koyambedu prices, 19 Oct 2026) — admin edits the live list.
 */
// ---------------------------------------------------------------- time (Asia/Kolkata, no DST)
export const IST_OFFSET = 5.5 * 3600e3;
export const HOUR = 3600e3, DAY = 24 * HOUR;
export const istParts = (ms: number) => { const d = new Date(ms + IST_OFFSET); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), h: d.getUTCHours(), min: d.getUTCMinutes() }; };
/** Epoch ms for a wall-clock time in IST (day may overflow, Date.UTC normalises). */
export const istMs = (y: number, m: number, d: number, h = 0, min = 0) => Date.UTC(y, m, d, h, min) - IST_OFFSET;
/** Integer IST day number — the same formula is used in firestore.rules for the per-night deal caps. */
export const istDayNo = (ms: number) => Math.floor((ms + IST_OFFSET) / DAY);
export const istDate = (ms: number) => new Date(ms + IST_OFFSET).toISOString().slice(0, 10);
export const istHourFloat = (ms: number) => ((ms + IST_OFFSET) % DAY) / HOUR;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = (ms: number) => { const p = istParts(ms); return `${WD[p.dow]} ${p.d} ${MO[p.m]}`; };
export const fmtTime = (ms: number) => { const p = istParts(ms); const h = p.h % 12 || 12; return `${h}${p.min ? ':' + String(p.min).padStart(2, '0') : ''} ${p.h < 12 ? 'am' : 'pm'}`; };
export const fmtLeft = (ms: number) => { if (ms <= 0) return 'closed'; const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / HOUR), m = Math.floor((ms % HOUR) / 60e3);
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${Math.max(1, m)} min`; };
const rs = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const r2 = (n: number) => Math.round(n * 100) / 100;

// ================================================================ 1. GROUP-BUY METER
export interface Community { id: string; name: string; ta?: string; clusterId: string; gate: string; flats: number; leaderUid?: string; leaderName?: string; lat: number; lng: number }
export interface MeterSku { id: string; name: string; ta: string; emoji: string; unit: string; step: number; sundayPrice: number; fillPrice: number;
  refPrice?: number; refSource?: string; refDate?: string; caseQty: number; caseUnit: string; supplier: string; maxPerHousehold: number; cost?: number }
export interface WeeklyList { id: string; clusterId: string; weekOf: string; publishedAt: string; skus: MeterSku[] }
export type MeterStatus = 'open' | 'filled' | 'sundayClosed' | 'delivered';
export interface Meter { id: string; clusterId: string; clusterName: string; cycleId: string; listId: string; threshold: number; count: number; status: MeterStatus;
  openedAt: string; openedMs: number; cutoffAt: string; cutoffMs: number; filledAt?: string; closedAt?: string; tier?: 'fill' | 'sunday'; deliverySlot?: string; deliveryMs?: number; nextMeterId?: string; lastOrderId?: string; lastCancelId?: string }
export interface MeterLine { skuId: string; name: string; ta?: string; emoji?: string; unit: string; qty: number; sundayPrice: number; fillPrice: number }
export type BasketStatus = 'committed' | 'cancelled' | 'locked' | 'handed' | 'missed';
export interface MeterOrder { id: string; meterId: string; cycleId: string; communityId: string; customerUid: string; customer: string; phone: string; flat: string;
  lines: MeterLine[]; sundayTotal: number; fillTotal: number; prepaidAmount: number; pay: 'COD' | 'UPI_DOD'; paymentStatus: 'due' | 'collected'; status: BasketStatus; createdAt: string;
  finalTier?: 'fill' | 'sunday'; finalAmount?: number; refundDue?: number; refundTo?: 'not_charged' | 'wallet'; refundStatus?: 'none' | 'applied' | 'credited'; walletApplied?: number; amountDue?: number;
  dropId?: string; handoverStatus?: 'pending' | 'handed' | 'missed'; collectedVia?: 'cash' | 'upi'; handedAt?: string; cancelledAt?: string; updatedAt?: string }
export interface WalletEntry { id: string; uid: string; amount: number; reason: string; ref?: string; createdAt: string }
export const METER = { threshold: 100, minBasket: 300, leaderPct: 5, floor: 25, fillCheckHour: 21, cutoffDow: 6, cutoffHour: 21,
  fillSlot: '7–9 am', sundaySlot: 'Sun 9–11 am', fillMarkup: 1.38, sundayMarkup: 1.45 };
const sku = (id: string, name: string, ta: string, emoji: string, unit: string, step: number, cost: number, caseQty: number, caseUnit: string, supplier: string, max: number): MeterSku =>
  ({ id, name, ta, emoji, unit, step, cost, sundayPrice: Math.round(cost * METER.sundayMarkup), fillPrice: Math.round(cost * METER.fillMarkup), caseQty, caseUnit, supplier, maxPerHousehold: max });
/** Starter weekly list (32 items). cost = Koyambedu/wholesale ₹ per unit (estimate, report §10.7); tier prices = 1.45× / 1.38×. */
export const STARTER_SKUS: MeterSku[] = [
  sku('m1', 'Onion (big)', 'பெரிய வெங்காயம்', '🧅', 'kg', 1, 56, 50, '50 kg sack', 'Koyambedu – onion mandi', 5),
  sku('m2', 'Tomato', 'தக்காளி', '🍅', 'kg', 1, 30, 15, '15 kg crate', 'Koyambedu – veg', 5),
  sku('m3', 'Potato', 'உருளைக்கிழங்கு', '🥔', 'kg', 1, 31, 50, '50 kg sack', 'Koyambedu – veg', 5),
  sku('m4', 'Carrot', 'கேரட்', '🥕', 'kg', 0.5, 38, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m5', 'Beans (French)', 'பீன்ஸ்', '🫛', 'kg', 0.5, 65, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m6', 'Brinjal', 'கத்திரிக்காய்', '🍆', 'kg', 0.5, 36, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m7', 'Ladies finger', 'வெண்டைக்காய்', '🫑', 'kg', 0.5, 32, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m8', 'Cabbage', 'முட்டைக்கோஸ்', '🥬', 'kg', 1, 22, 20, '20 kg bag', 'Koyambedu – veg', 3),
  sku('m9', 'Cauliflower', 'காலிஃபிளவர்', '🥦', 'piece', 1, 28, 12, 'dozen', 'Koyambedu – veg', 2),
  sku('m10', 'Green chilli', 'பச்சை மிளகாய்', '🌶️', 'kg', 0.25, 60, 5, '5 kg bag', 'Koyambedu – veg', 1),
  sku('m11', 'Ginger', 'இஞ்சி', '🫚', 'kg', 0.25, 90, 5, '5 kg bag', 'Koyambedu – veg', 1),
  sku('m12', 'Garlic', 'பூண்டு', '🧄', 'kg', 0.25, 140, 5, '5 kg bag', 'Koyambedu – veg', 1),
  sku('m13', 'Coriander', 'கொத்தமல்லி', '🌿', 'bunch', 1, 6, 50, '50 bunches', 'Koyambedu – greens', 4),
  sku('m14', 'Curry leaves', 'கறிவேப்பிலை', '🌱', 'bunch', 1, 4, 50, '50 bunches', 'Koyambedu – greens', 4),
  sku('m15', 'Drumstick', 'முருங்கைக்காய்', '🥢', 'kg', 0.5, 70, 10, '10 kg bundle', 'Koyambedu – veg', 2),
  sku('m16', 'Beetroot', 'பீட்ரூட்', '🟣', 'kg', 0.5, 34, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m17', 'Cucumber', 'வெள்ளரிக்காய்', '🥒', 'kg', 0.5, 30, 10, '10 kg bag', 'Koyambedu – veg', 3),
  sku('m18', 'Banana (Robusta)', 'வாழைப்பழம்', '🍌', 'dozen', 1, 40, 12, 'bunch of 12 dozen', 'Koyambedu – fruit', 3),
  sku('m19', 'Apple (Shimla)', 'ஆப்பிள்', '🍎', 'kg', 0.5, 120, 10, '10 kg box', 'Koyambedu – fruit', 3),
  sku('m20', 'Orange (Nagpur)', 'ஆரஞ்சு', '🍊', 'kg', 1, 60, 10, '10 kg box', 'Koyambedu – fruit', 3),
  sku('m21', 'Papaya', 'பப்பாளி', '🥭', 'piece', 1, 35, 10, '10 pcs', 'Koyambedu – fruit', 2),
  sku('m22', 'Lemon', 'எலுமிச்சை', '🍋', 'piece', 5, 3, 100, '100 pcs', 'Koyambedu – fruit', 20),
  sku('m23', 'Coconut', 'தேங்காய்', '🥥', 'piece', 1, 22, 50, '50 pcs', 'Koyambedu – coconut', 4),
  sku('m24', 'Ponni rice (raw)', 'பொன்னி அரிசி', '🍚', 'kg', 5, 52, 25, '25 kg bag', 'Redhills rice mill (distributor)', 25),
  sku('m25', 'Toor dal', 'துவரம் பருப்பு', '🫘', 'kg', 1, 118, 30, '30 kg bag', 'Kothawal Chavadi – pulses', 3),
  sku('m26', 'Urad dal', 'உளுந்து', '⚪', 'kg', 1, 112, 30, '30 kg bag', 'Kothawal Chavadi – pulses', 3),
  sku('m27', 'Sugar', 'சர்க்கரை', '🧂', 'kg', 1, 41, 50, '50 kg bag', 'Kothawal Chavadi – grocery', 5),
  sku('m28', 'Groundnut oil', 'கடலை எண்ணெய்', '🛢️', 'litre', 1, 165, 15, '15 L tin', 'Oil distributor', 5),
  sku('m29', 'Tamarind', 'புளி', '🟤', 'kg', 0.5, 120, 10, '10 kg bag', 'Kothawal Chavadi – grocery', 2),
  sku('m30', 'Eggs', 'முட்டை', '🥚', 'tray of 30', 1, 150, 6, '6 trays', 'Namakkal egg agent', 2),
  sku('m31', 'Aavin ghee', 'நெய்', '🧈', '500 ml', 1, 320, 12, 'carton of 12', 'Aavin distributor', 2),
  sku('m32', 'Turmeric powder', 'மஞ்சள் தூள்', '🟡', '200 g', 1, 38, 50, 'carton of 50', 'Spice distributor', 3),
];
/** The report's worked 7-item basket (≈₹463 Sunday / ≈₹441 fill). */
export const SAMPLE_BASKET: Record<string, number> = { m1: 2, m2: 2, m3: 2, m4: 0.5, m5: 0.5, m6: 0.5, m7: 0.5 };
export const COMMUNITIES: Community[] = [
  { id: 'c1', name: 'Ramaniyam Callista', ta: 'ரமணியம் காலிஸ்டா', clusterId: 'porur-west', gate: 'Gate 2 security cabin', flats: 320, lat: 13.0361, lng: 80.1512 },
  { id: 'c2', name: 'Prestige Bella Vista', ta: 'பிரெஸ்டீஜ் பெல்லா விஸ்டா', clusterId: 'porur-west', gate: 'Tower A drop zone', flats: 900, lat: 13.0412, lng: 80.1489 },
  { id: 'c3', name: 'Casagrand Royale', ta: 'காசாகிராண்ட் ராயல்', clusterId: 'porur-west', gate: 'Main gate clubhouse', flats: 410, lat: 13.0318, lng: 80.1561 },
  { id: 'c4', name: 'Jains Pebble Brook', ta: 'ஜெயின்ஸ் பெப்பிள் புரூக்', clusterId: 'porur-west', gate: 'Gate 1 visitor bay', flats: 260, lat: 13.0447, lng: 80.1555 },
];
export const CLUSTERS: Record<string, string> = { 'porur-west': 'Porur West cluster' };
/** Saturday 9 pm IST strictly after `now` (the Sunday-buy cutoff). */
export function nextCutoffMs(now = Date.now()) {
  const p = istParts(now); const add = (METER.cutoffDow - p.dow + 7) % 7; let ms = istMs(p.y, p.m, p.d + add, METER.cutoffHour);
  if (ms <= now) ms = istMs(p.y, p.m, p.d + add + 7, METER.cutoffHour); return ms;
}
export const sundayDeliveryMs = (cutoffMs: number) => cutoffMs + 12 * HOUR; // Sat 9 pm → Sun 9 am
export const cycleIdFor = (cutoffMs: number) => 'wk-' + istDate(cutoffMs);
export function basketTotals(lines: { skuId: string; qty: number }[], skus: MeterSku[]) {
  const ls: MeterLine[] = []; for (const l of lines) { const k = skus.find(x => x.id === l.skuId); if (!k || !(l.qty > 0)) continue;
    ls.push({ skuId: k.id, name: k.name, ta: k.ta, emoji: k.emoji, unit: k.unit, qty: l.qty, sundayPrice: k.sundayPrice, fillPrice: k.fillPrice }); }
  const sundayTotal = Math.round(ls.reduce((a, l) => a + l.sundayPrice * l.qty, 0)), fillTotal = Math.round(ls.reduce((a, l) => a + l.fillPrice * l.qty, 0));
  return { lines: ls, sundayTotal, fillTotal, saving: sundayTotal - fillTotal, ok: sundayTotal >= METER.minBasket, short: Math.max(0, METER.minBasket - sundayTotal) };
}
/** Pace = baskets per hour since the meter opened. Uncertain (show only the Sunday date) when < 5 baskets or opened < 12 h ago. */
export function meterForecast(m: Pick<Meter, 'count' | 'threshold' | 'openedMs' | 'cutoffMs' | 'status' | 'deliveryMs'>, now = Date.now()) {
  const left = Math.max(0, m.threshold - m.count), pct = Math.min(100, Math.round((m.count / m.threshold) * 100));
  const sundayMs = sundayDeliveryMs(m.cutoffMs);
  if (m.status !== 'open') return { left, pct, pace: 0, certain: true, fillMs: undefined as number | undefined, deliveryMs: m.deliveryMs ?? sundayMs, sundayMs,
    text: m.status === 'filled' ? `Batch closed at ${m.threshold} · delivery ${fmtDay(m.deliveryMs ?? sundayMs)} ${METER.fillSlot}` : `Sunday buy · delivery ${fmtDay(m.deliveryMs ?? sundayMs)} 9–11 am` };
  const hrs = (now - m.openedMs) / HOUR, pace = hrs > 0 ? m.count / hrs : 0;
  if (left === 0) { const p = istParts(now); let check = istMs(p.y, p.m, p.d, METER.fillCheckHour); if (check < now) check += DAY; const del = istMs(istParts(check + DAY).y, istParts(check + DAY).m, istParts(check + DAY).d, 7);
    return { left, pct, pace, certain: true, fillMs: now, deliveryMs: del, sundayMs, text: `Full! Closes ${fmtTime(check)} today · delivery ${fmtDay(del)} ${METER.fillSlot}` }; }
  if (m.count < 5 || hrs < 12 || pace <= 0) return { left, pct, pace, certain: false, fillMs: undefined, deliveryMs: sundayMs, sundayMs, text: `Delivery ${fmtDay(sundayMs)} 9–11 am (Sunday buy) — or sooner if the meter fills` };
  const fillAt = now + (left / pace) * HOUR;
  if (fillAt >= m.cutoffMs) return { left, pct, pace, certain: true, fillMs: undefined, deliveryMs: sundayMs, sundayMs, text: `At this pace it won't fill before Saturday — delivery ${fmtDay(sundayMs)} 9–11 am at the Sunday price` };
  const fp = istParts(fillAt); let check = istMs(fp.y, fp.m, fp.d, METER.fillCheckHour); if (check < fillAt) check += DAY; const dp = istParts(check + DAY);
  const del = istMs(dp.y, dp.m, dp.d, 7);
  return { left, pct, pace, certain: true, fillMs: fillAt, deliveryMs: del, sundayMs, text: `At the current pace it should fill ${fmtDay(check)} night → delivery ${fmtDay(del)} ${METER.fillSlot}. Otherwise ${fmtDay(sundayMs)} 9–11 am.` };
}
/** What one basket finally costs once the batch closes. Pay-on-delivery: the lower fill price is simply what the rider/leader collects.
 *  Wallet credit (refund-of-difference) is used for prepaid baskets (when online pay launches) and for line refunds; it is applied to the next basket. */
export function settleBasket(o: Pick<MeterOrder, 'sundayTotal' | 'fillTotal' | 'pay'> & { prepaid?: boolean }, tier: 'fill' | 'sunday', walletBalance = 0) {
  const finalAmount = tier === 'fill' ? o.fillTotal : o.sundayTotal; const refundDue = o.sundayTotal - finalAmount;
  const walletApplied = Math.min(Math.max(0, walletBalance), finalAmount);
  return { finalTier: tier, finalAmount, refundDue, refundTo: (o.prepaid ? 'wallet' : 'not_charged') as 'wallet' | 'not_charged',
    refundStatus: (refundDue > 0 ? (o.prepaid ? 'credited' : 'applied') : 'none') as 'none' | 'applied' | 'credited', walletApplied, amountDue: finalAmount - walletApplied };
}
export interface PoLine { skuId: string; name: string; unit: string; qty: number; cases: number; orderQty: number; caseQty: number; caseUnit: string; supplier: string; estCost: number }
/** Sum per SKU across the batch, round UP to the supplier's case/lot size. */
export function aggregateSkus(orders: Pick<MeterOrder, 'lines' | 'status'>[], skus: MeterSku[]): PoLine[] {
  const tot: Record<string, number> = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => o.lines.forEach(l => (tot[l.skuId] = r2((tot[l.skuId] || 0) + l.qty))));
  return Object.entries(tot).map(([id, qty]) => { const k = skus.find(x => x.id === id)!; const caseQty = k?.caseQty || 1; const cases = Math.ceil(qty / caseQty - 1e-9);
    return { skuId: id, name: k?.name || id, unit: k?.unit || '', qty, cases, orderQty: cases * caseQty, caseQty, caseUnit: k?.caseUnit || '', supplier: k?.supplier || 'Unassigned', estCost: Math.round((k?.cost || 0) * cases * caseQty) }; })
    .sort((a, b) => a.supplier.localeCompare(b.supplier) || a.name.localeCompare(b.name));
}
export const groupPos = (lines: PoLine[]) => lines.reduce((m, l) => ((m[l.supplier] ||= []).push(l), m), {} as Record<string, PoLine[]>);
const csvCell = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export function poCsv(batchId: string, lines: PoLine[]) {
  const rows = [['batch', 'supplier', 'item', 'unit', 'ordered_by_households', 'case_size', 'cases', 'order_qty', 'est_cost_inr']];
  lines.forEach(l => rows.push([batchId, l.supplier, l.name, l.unit, String(l.qty), `${l.caseQty} (${l.caseUnit})`, String(l.cases), String(l.orderQty), String(l.estCost)]));
  return rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n';
}
/** Per-community pick lists (household → items) for the gate drop. */
export function pickLists(orders: MeterOrder[]) {
  return orders.filter(o => o.status !== 'cancelled').reduce((m, o) => ((m[o.communityId] ||= []).push(o), m), {} as Record<string, MeterOrder[]>);
}
export const leaderEarnings = (orders: Pick<MeterOrder, 'status' | 'handoverStatus' | 'finalAmount' | 'sundayTotal'>[]) => {
  const delivered = orders.filter(o => o.handoverStatus === 'handed' || o.status === 'handed');
  const sales = delivered.reduce((a, o) => a + (o.finalAmount ?? o.sundayTotal), 0);
  return { delivered: delivered.length, sales, commission: Math.round(sales * METER.leaderPct) / 100 };
};
export const walletBalance = (entries: Pick<WalletEntry, 'amount'>[]) => entries.reduce((a, e) => a + e.amount, 0);
export const shareText = (m: Pick<Meter, 'clusterName' | 'count' | 'threshold' | 'id'>, link: string) =>
  `🧺 ${m.clusterName} group buy: ${m.count}/${m.threshold} baskets. Fresh Koyambedu veg & staples at the gate — price drops when we hit ${m.threshold}. Join: ${link}`;

// ================================================================ 2. OFFICE LUNCH (home cooks)
export const LUNCH = { minPacks: 5, minPrice: 130, maxPrice: 150, slot: '12:15–12:45', cutoffHour: 20, slotStartH: 12.25 };
export interface Cook { id: string; uid?: string; name: string; kitchen: string; area: string; fssaiNo: string; fssaiExpiry: string; rating: number; status: 'active' | 'paused'; veg: boolean; nonVeg: boolean; capacity: number }
export interface MealMenu { id: string; cookId: string; cookName: string; date: string; cutoffMs: number; vegDish: string; vegPrice: number; nonVegDish?: string; nonVegPrice?: number;
  capacity: number; booked: number; checklistDone?: boolean; checklist?: Record<string, boolean>; lastOrderId?: string; updatedAt?: string }
export type LunchStatus = 'placed' | 'confirmed' | 'cooking' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
export interface LunchOrder { id: string; customerUid: string; customer: string; phone: string; company: string; gstin?: string; office: string; officeId: string; floor?: string;
  date: string; menuId: string; cookId: string; slot: string; vegPacks: number; nonVegPacks: number; packs: number; vegPrice: number; nonVegPrice: number; total: number;
  pay: 'COD' | 'UPI_DOD'; paymentStatus: 'due' | 'collected'; status: LunchStatus; dropId?: string; note?: string; createdAt: string; updatedAt?: string }
export const OFFICES = [
  { id: 'dlf-b5', name: 'DLF Cybercity Manapakkam — Block 5', short: 'DLF Block 5', lat: 13.0213, lng: 80.1771 },
  { id: 'dlf-b9', name: 'DLF Cybercity Manapakkam — Block 9', short: 'DLF Block 9', lat: 13.0201, lng: 80.1795 },
  { id: 'lnt-mm', name: 'L&T Business Park, Manapakkam', short: 'L&T Manapakkam', lat: 13.0186, lng: 80.1712 },
  { id: 'porur-tp', name: 'Porur IT Park (Mount-Poonamallee Rd)', short: 'Porur IT Park', lat: 13.0355, lng: 80.1631 },
];
export const HYGIENE_ITEMS: [string, string][] = [['hairnet', 'Hairnet, apron & gloves on'], ['surfaces', 'Surfaces & vessels cleaned'], ['fridge', 'Fridge below 5 °C (checked)'], ['water', 'Drinking water from RO / boiled'], ['packed', 'Meals packed & sealed, sample kept 48 h']];
export const ONBOARD_ITEMS: [string, string][] = [['fssai', 'FSSAI registration certificate (₹100/yr)'], ['medical', 'Medical fitness certificate'], ['pest', 'Kitchen pest-controlled'], ['water', 'Potable water source'], ['visit', 'Agree to a kitchen visit before day 1']];
/** Orders for date D close at 8 pm IST the evening before. */
export const lunchCutoffMs = (date: string) => { const [y, m, d] = date.split('-').map(Number); return istMs(y, m - 1, d - 1, LUNCH.cutoffHour); };
/** Next date that is still open for ordering (tomorrow if before 8 pm, else the day after). Skips Sundays. */
export function nextLunchDate(now = Date.now()) {
  for (let i = 1; i < 8; i++) { const p = istParts(now + i * DAY); const ds = istDate(istMs(p.y, p.m, p.d)); if (p.dow !== 0 && lunchCutoffMs(ds) > now) return ds; }
  return istDate(now + DAY);
}
export function lunchTotals(vegPacks: number, nonVegPacks: number, menu: Pick<MealMenu, 'vegPrice' | 'nonVegPrice' | 'capacity' | 'booked' | 'cutoffMs'>, now = Date.now()) {
  const packs = vegPacks + nonVegPacks, total = vegPacks * menu.vegPrice + nonVegPacks * (menu.nonVegPrice || 0);
  const errors: string[] = [];
  if (packs < LUNCH.minPacks) errors.push(`Minimum ${LUNCH.minPacks} packs per office order (you have ${packs}).`);
  if (nonVegPacks > 0 && !menu.nonVegPrice) errors.push('This cook has no non-veg meal tomorrow.');
  if (menu.booked + packs > menu.capacity) errors.push(`Only ${Math.max(0, menu.capacity - menu.booked)} packs left with this cook.`);
  if (now >= menu.cutoffMs) errors.push('Orders for this day closed at 8 pm yesterday.');
  return { packs, total, errors, ok: !errors.length };
}
export const priceOk = (p?: number) => p == null || (p >= LUNCH.minPrice && p <= LUNCH.maxPrice);

// ================================================================ 3. HOME SERVICES
export const SERVICE_FEE = 149, WARRANTY_DAYS = 30;
export interface Service { id: string; name: string; ta: string; emoji: string; blurb: string; rateCard: [string, number][]; sla: string }
export const SERVICES: Service[] = [
  { id: 'plumber', name: 'Plumber', ta: 'பிளம்பர்', emoji: '🔧', blurb: 'Leaks, taps, flush tanks, blocked drains', sla: 'Same day', rateCard: [['Tap / mixer replace', 199], ['Flush tank repair', 349], ['Blocked drain', 399], ['Pipe leak (per joint)', 249]] },
  { id: 'electrician', name: 'Electrician', ta: 'எலக்ட்ரீஷியன்', emoji: '💡', blurb: 'Petty repairs: switches, fans, lights, MCB trips', sla: 'Same day', rateCard: [['Switch / socket', 99], ['Fan install / repair', 249], ['Light fitting', 149], ['MCB / fuse check', 199]] },
  { id: 'appliance', name: 'Appliance repair', ta: 'சாதனம் பழுது', emoji: '🔌', blurb: 'Mixie, washing machine, fridge, geyser, RO', sla: 'Next day', rateCard: [['Mixie / grinder', 299], ['Geyser service', 449], ['Washing machine', 499], ['RO service', 399]] },
  { id: 'deepclean', name: 'Deep cleaning', ta: 'ஆழ்ந்த சுத்தம்', emoji: '🧽', blurb: 'Kitchen, bathroom or full-home deep clean (2-person team)', sla: 'Next day', rateCard: [['Bathroom', 599], ['Kitchen', 1199], ['1 BHK full home', 2999], ['2 BHK full home', 3999]] },
];
/** 2-hour visit windows */
export const SLOTS: [string, string][] = [['08', '8–10 am'], ['10', '10 am–12 pm'], ['12', '12–2 pm'], ['14', '2–4 pm'], ['16', '4–6 pm'], ['18', '6–8 pm']];
export type JobStatus = 'requested' | 'assigned' | 'en_route' | 'started' | 'quoted' | 'quote_approved' | 'quote_declined' | 'done' | 'cancelled';
export const JOB_STEPS: [JobStatus, string][] = [['requested', 'Requested'], ['assigned', 'Pro assigned'], ['en_route', 'On the way'], ['started', 'Inspection started'], ['quoted', 'Quote sent'], ['quote_approved', 'Quote approved'], ['done', 'Done']];
export interface Pro { id: string; uid?: string; name: string; skills: string[]; area: string; rating: number; ratingCount: number; jobsDone: number; status: 'active' | 'paused'; policeVerified: boolean; since?: string }
export interface Job { id: string; customerUid: string; customer: string; phone: string; serviceId: string; serviceName: string; address: string; problem: string;
  slotDate: string; slot: string; slotLabel: string; slotStartMs: number; inspectionFee: number; pay: 'COD' | 'UPI_DOD'; paymentStatus: 'due' | 'collected'; status: JobStatus; proId?: string; proName?: string;
  quoteLines?: { label: string; amount: number }[]; quoteTotal?: number; startCode?: string; finishCode?: string; startedAt?: string; doneAt?: string; warrantyUntil?: string; warrantyUntilMs?: number;
  warrantyOf?: string; rating?: number; review?: string; ratedAt?: string; createdAt: string; updatedAt?: string; collectedVia?: 'cash' | 'upi' }
export const slotStartMs = (date: string, slot: string) => { const [y, m, d] = date.split('-').map(Number); return istMs(y, m - 1, d, +slot); };
export const jobPayable = (j: Pick<Job, 'inspectionFee' | 'quoteTotal' | 'status'>) => j.inspectionFee + (j.status === 'done' || j.status === 'quote_approved' ? j.quoteTotal || 0 : 0);
export const inWarranty = (j: Pick<Job, 'status' | 'warrantyUntilMs'>, now = Date.now()) => j.status === 'done' && !!j.warrantyUntilMs && now < j.warrantyUntilMs;
export const KYC_FIELDS: [string, string][] = [['idType', 'ID type (Aadhaar / Voter ID / DL)'], ['idLast4', 'Last 4 digits of ID'], ['addressProof', 'Address proof (type)'], ['policeRef', 'Police verification ref. no.'], ['eshram', 'e-Shram / UAN number'], ['tnelb', 'TNELB licence no. (electricians)']];

// ================================================================ 4. SURPLUS FLASH DEALS
export const DEALS = { maxPriceRatio: 0.7, minMinutes: 60, maxMinutes: 90, capDeals: 2, capUnits: 20, deliveryFee: 39, radiusKm: 3, quietAfter: 22.5, fromHour: 21, toHour: 23, minRating: 4.0, maxComplaints7d: 2, runs: ['9:45 pm', '10:30 pm'] };
export interface Deal { id: string; storeId: string; storeName: string; fssaiNo: string; productId: string; item: string; ta?: string; emoji?: string; qtyTotal: number; qtyLeft: number;
  regularPrice: number; dealPrice: number; discountPct: number; preparedAt: string; windowStartMs: number; expiresAtMs: number; expiresAt: string; dayNo: number;
  fulfil: 'pickup' | 'both'; deliveryFee: number; veg: boolean; allergens?: string; status: 'live' | 'soldOut' | 'expired' | 'removed'; voiceTranscript?: string; lat: number; lng: number;
  createdAt: string; confirmedAt: string; lastClaimId?: string; removedReason?: string }
export interface DealClaim { id: string; dealId: string; storeId: string; storeName: string; item: string; customerUid: string; customer: string; phone: string; qty: number; price: number; deliveryFee: number; total: number;
  fulfil: 'pickup' | 'delivery'; address?: string; pay: 'COD' | 'UPI_DOD'; status: 'claimed' | 'picked_up' | 'delivered' | 'no_show' | 'cancelled'; rider?: string; run?: string; pickupCode?: string;
  rating?: number; complaint?: string; ratedAt?: string; createdAt: string; expiresAtMs: number; updatedAt?: string }
export interface DealPrefs { optIn: boolean; radiusKm: number; vegOnly: boolean; lat: number; lng: number; area: string; lastDealPushAt?: string; lastPushDay?: number }
export const AREAS: [string, number, number][] = [['Porur', 13.0382, 80.1565], ['Ramapuram', 13.0317, 80.1817], ['Valasaravakkam', 13.0405, 80.1726], ['Iyyappanthangal', 13.0405, 80.1347], ['Manapakkam', 13.0210, 80.1770], ['Gerugambakkam', 13.0153, 80.1371]];
export const kmBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371, d = Math.PI / 180, x = (b.lat - a.lat) * d, y = (b.lng - a.lng) * d;
  const h = Math.sin(x / 2) ** 2 + Math.cos(a.lat * d) * Math.cos(b.lat * d) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h));
};
/** Who gets a "deal live" push: opted in, within radius, veg preference respected, not pushed yet today (IST), not after 10:30 pm IST. */
export function shouldPush(p: DealPrefs, deal: Pick<Deal, 'lat' | 'lng' | 'veg'>, now = Date.now()) {
  if (!p?.optIn) return 'not opted in';
  if (istHourFloat(now) >= DEALS.quietAfter || istHourFloat(now) < 7) return 'quiet hours';
  if (p.vegOnly && !deal.veg) return 'veg only';
  if (kmBetween(p, deal) > (p.radiusKm || DEALS.radiusKm)) return 'too far';
  if (p.lastPushDay === istDayNo(now)) return 'already pushed today';
  return '';
}
export function validateDeal(d: { qty: number; regularPrice: number; dealPrice: number; minutes: number }, used: { deals: number; units: number } = { deals: 0, units: 0 }) {
  const errors: string[] = [], warnings: string[] = []; const pct = d.regularPrice ? Math.round((1 - d.dealPrice / d.regularPrice) * 100) : 0;
  if (!(d.qty >= 1)) errors.push('Quantity must be at least 1.');
  if (!(d.dealPrice > 0)) errors.push('Enter a deal price.');
  if (d.dealPrice > d.regularPrice * DEALS.maxPriceRatio) errors.push(`Deal price must be at least 30% off — max ${rs(Math.floor(d.regularPrice * DEALS.maxPriceRatio))} for this item.`);
  if (d.minutes < DEALS.minMinutes || d.minutes > DEALS.maxMinutes) errors.push('A deal runs 60–90 minutes.');
  if (used.deals + 1 > DEALS.capDeals) errors.push(`Tonight's limit is ${DEALS.capDeals} deals — you've used ${used.deals}.`);
  if (used.units + d.qty > DEALS.capUnits) errors.push(`Tonight's limit is ${DEALS.capUnits} portions — ${Math.max(0, DEALS.capUnits - used.units)} left.`);
  if (pct >= 30 && pct < 35) warnings.push('Just above the 30% minimum — bigger discounts sell faster.');
  return { ok: !errors.length, errors, warnings, pct };
}
// ---- voice → deal parser (Tamil / Tanglish / English) ----
const UNITS: Record<string, number> = {
  zero: 0, one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  oru: 1, onnu: 1, rendu: 2, irandu: 2, moonu: 3, naalu: 4, anju: 5, aaru: 6, ezhu: 7, ettu: 8, onbadhu: 9, pathu: 10, padhu: 10,
  'ஒரு': 1, 'ஒன்று': 1, 'ஒண்ணு': 1, 'இரண்டு': 2, 'ரெண்டு': 2, 'மூன்று': 3, 'மூணு': 3, 'நான்கு': 4, 'நாலு': 4, 'ஐந்து': 5, 'அஞ்சு': 5, 'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
  'பதினொன்று': 11, 'பன்னிரண்டு': 12, 'பதினைந்து': 15, 'பதினஞ்சு': 15,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, irupathu: 20, mupathu: 30, naarpathu: 40, aimbathu: 50, arupathu: 60, ezhupathu: 70, enbathu: 80,
  'இருபது': 20, 'முப்பது': 30, 'நாற்பது': 40, 'ஐம்பது': 50, 'அறுபது': 60, 'எழுபது': 70, 'எண்பது': 80, 'தொண்ணூறு': 90,
  'இருபத்தி': 20, 'முப்பத்தி': 30, 'நாற்பத்தி': 40, 'ஐம்பத்தி': 50, 'அறுபத்தி': 60, 'எழுபத்தி': 70, 'எண்பத்தி': 80, 'தொண்ணூற்றி': 90 };
const HUNDREDS: Record<string, number> = { hundred: 100, nooru: 100, 'நூறு': 100, 'நூற்றி': 100, 'நூத்தி': 100, irunooru: 200, 'இருநூறு': 200, 'இருநூற்றி': 200, 'முன்னூறு': 300, 'முன்னூற்றி': 300 };
/** Replace runs of number words with digits: "one hundred fifty" → 150, "நூற்றி ஐம்பது" → 150, "பத்து" → 10. */
export function wordsToNumbers(text: string) {
  const toks = text.toLowerCase().replace(/₹\s*/g, ' ₹').replace(/rs\.?\s*(?=\d)/g, '₹').split(/\s+/).filter(Boolean); const out: string[] = []; let acc: number | null = null, prevUnit = false;
  const flush = () => { if (acc != null) out.push(String(acc)); acc = null; prevUnit = false; };
  for (const raw of toks) { const t = raw.replace(/[.,!?]+$/, '');
    if (t in HUNDREDS) { if (prevUnit && acc != null && acc < 10) acc = acc * 100; else acc = (acc || 0) + HUNDREDS[t]; prevUnit = false; continue; }
    if (t in TENS) { acc = (acc || 0) + TENS[t]; prevUnit = false; continue; }
    if (t in UNITS && !(t === 'a' || t === 'an') ) { acc = (acc || 0) + UNITS[t]; prevUnit = true; continue; }
    if ((t === 'a' || t === 'an') && acc == null) { out.push(raw); continue; }
    flush(); out.push(raw); }
  flush(); return out.join(' ');
}
export interface DealDraft { productId?: string; item?: string; qty?: number; dealPrice?: number; offRs?: number; offPct?: number; minutes: number; regularPrice?: number; fulfil: 'pickup' | 'both'; notes: string[] }
const OFF_RE = /^\s*(?:rs\.?|rupees?|ரூபாய்\S*|roobai|rupa\S*)?\s*(?:off|discount|தள்ளுபடி|குறைவு|kammi|less|கம்மி)/;
const RUPEE_AFTER = /^\s*(?:rs\.?|rupees?|ரூபாய்\S*|roobai|rupa\S*|off|discount|தள்ளுபடி|குறைவு)/;
/** "10 biriyanis at 100 off", "பத்து பிரியாணி நூறு ரூபாய் தள்ளுபடி", "5 parotta at 40% off for 90 minutes", "8 veg meals for ₹80" */
export function parseDeal(text: string, catalogue: { id: string; name: string; ta?: string; kw?: string[]; price: number }[]): DealDraft {
  let t = wordsToNumbers(text).replace(/(\d)\s*(%|percent|சதவீதம்)/g, '$1%'); const notes: string[] = [];
  let best: { p: typeof catalogue[0]; len: number } | undefined;
  for (const p of catalogue) for (const k of [p.name.toLowerCase(), ...(p.kw || []), ...(p.ta ? [p.ta] : [])]) if (k && t.includes(k.toLowerCase()) && (!best || k.length > best.len)) best = { p, len: k.length };
  const product = best?.p;
  let minutes = 60; const mm = t.match(/(\d+)\s*(?:min|mins|minutes|நிமிட\S*)/), hh = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|மணி\S*)/);
  if (mm) { minutes = +mm[1]; t = t.replace(mm[0], ' '); } else if (hh) { minutes = Math.round(+hh[1] * 60); t = t.replace(hh[0], ' '); } else if (/ஒன்றரை மணி|one and a half hour|1 and half hour/.test(t)) minutes = 90;
  let offPct: number | undefined; const pm = t.match(/(\d+(?:\.\d+)?)%/); if (pm) { offPct = +pm[1]; t = t.replace(pm[0], ' % '); }
  const nums = [...t.matchAll(/(₹)?\s?(\d+(?:\.\d+)?)/g)].map(m => ({ v: parseFloat(m[2]), rupee: !!m[1], after: t.slice(m.index! + m[0].length, m.index! + m[0].length + 30) }));
  const qtyN = nums.find(n => !n.rupee && !RUPEE_AFTER.test(n.after)); const qty = qtyN?.v;
  let offRs: number | undefined, dealPrice: number | undefined;
  for (const n of nums) { if (n === qtyN) continue; if (OFF_RE.test(n.after)) offRs ??= n.v; else dealPrice ??= n.v; }
  const reg = product?.price;
  if (reg != null && dealPrice == null) { if (offPct != null) dealPrice = Math.round(reg * (1 - offPct / 100)); else if (offRs != null) dealPrice = reg - offRs; }
  if (!product) notes.push("Couldn't match an item from your menu — pick it below.");
  if (qty == null) notes.push('Say how many portions, e.g. "10 biriyani".');
  if (dealPrice == null) notes.push('Say the discount, e.g. "100 off", "40% off" or "at 150".');
  const fulfil = /deliver|டெலிவரி/.test(t) ? 'both' : 'pickup';
  return { productId: product?.id, item: product?.name, qty, dealPrice, offRs, offPct, minutes: Math.min(DEALS.maxMinutes, Math.max(DEALS.minMinutes, minutes)), regularPrice: reg, fulfil, notes };
}
/** Surplus-food store + menu (seeded into stores/s4 + products p19–p24). Not shown in the regular grocery categories. */
export const FOOD_STORES = [{ id: 's4', name: 'Porur Biryani Point', cat: 'food', type: 'Restaurant (FSSAI licensed)', eta: 'Pickup', rating: 4.4, open: '11 AM – 11 PM', commission: 15, lat: 13.0371, lng: 80.1590, fssaiNo: '12426999000123' }];
export const FOOD_PRODUCTS = [
  { id: 'p19', store: 's4', cat: 'food', name: 'Chicken Biryani', ta: 'சிக்கன் பிரியாணி', unit: 'plate', price: 250, emoji: '🍗', kw: ['biryani', 'biriyani', 'briyani', 'பிரியாணி', 'chicken biryani'], veg: false },
  { id: 'p20', store: 's4', cat: 'food', name: 'Veg Biryani', ta: 'வெஜ் பிரியாணி', unit: 'plate', price: 180, emoji: '🍚', kw: ['veg biryani', 'வெஜ் பிரியாணி'], veg: true },
  { id: 'p21', store: 's4', cat: 'food', name: 'Parotta + Salna (2 pcs)', ta: 'பரோட்டா', unit: 'set', price: 90, emoji: '🫓', kw: ['parotta', 'porotta', 'பரோட்டா'], veg: false },
  { id: 'p22', store: 's4', cat: 'food', name: 'Veg Meals', ta: 'சைவ சாப்பாடு', unit: 'meal', price: 140, emoji: '🍛', kw: ['meals', 'saapadu', 'சாப்பாடு'], veg: true },
  { id: 'p23', store: 's4', cat: 'food', name: 'Idli (4) + Vada', ta: 'இட்லி வடை', unit: 'plate', price: 70, emoji: '🍥', kw: ['idli', 'இட்லி'], veg: true },
  { id: 'p24', store: 's4', cat: 'food', name: 'Mutton Chukka', ta: 'மட்டன் சுக்கா', unit: 'plate', price: 320, emoji: '🍖', kw: ['mutton', 'chukka', 'மட்டன்'], veg: false },
];
export const dealDayNo = istDayNo;
export const isDealLive = (d: Pick<Deal, 'status' | 'expiresAtMs' | 'qtyLeft'>, now = Date.now()) => d.status === 'live' && d.expiresAtMs > now && d.qtyLeft > 0;
/** Deal quality: rating avg over rated claims; auto-pause below 4.0 (≥3 ratings) or ≥2 complaints in 7 days. Same logic runs in the Cloud Function. */
export function vendorQuality(claims: Pick<DealClaim, 'rating' | 'complaint' | 'createdAt'>[], now = Date.now()) {
  const rated = claims.filter(c => c.rating), avg = rated.length ? rated.reduce((a, c) => a + (c.rating || 0), 0) / rated.length : 0;
  const complaints7d = claims.filter(c => c.complaint && now - +new Date(c.createdAt) < 7 * DAY).length;
  const pause = (rated.length >= 3 && avg < DEALS.minRating) || complaints7d >= DEALS.maxComplaints7d;
  return { avg: Math.round(avg * 10) / 10, ratings: rated.length, complaints7d, pause, reason: pause ? (complaints7d >= DEALS.maxComplaints7d ? `${complaints7d} complaints in 7 days` : `rating ${avg.toFixed(1)} < 4.0`) : '' };
}
// ================================================================ batched drops (gate drops, lunch runs, deal delivery runs)
export interface Drop { id: string; kind: 'meter' | 'lunch' | 'deal'; ref: string; title: string; address: string; slot: string; riderId?: string; orderIds: string[]; count: number;
  status: 'assigned' | 'picked_up' | 'delivered'; uids: string[]; communityId?: string; officeId?: string; dropCode?: string; deliveredAt?: string; createdAt: string; updatedAt?: string; lat?: number; lng?: number }
export const newCode = () => String(1000 + Math.floor(Math.random() * 9000));
export const newId = (p: string) => p + Date.now().toString(36).slice(-5).toUpperCase() + Math.floor(Math.random() * 90 + 10);

/** Public web prototype (GitHub Pages) — used for share/join links that open on any phone. */
export const WEB_URL = 'https://kollicoder.github.io/porur-delivery-prototype/';
export const joinLink = (communityId?: string) => `${WEB_URL}#/customer/meter${communityId ? '/' + communityId : ''}`;
