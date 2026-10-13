import { PRODUCTS, Product } from './catalogue';
import { deliveryFee, Settings, DEFAULT_SETTINGS } from './pricing';
export type LiveProduct = Product & { inStock?: boolean };

export type OrderStatus = 'placed' | 'accepted' | 'rejected' | 'ready' | 'picked_up' | 'on_the_way' | 'delivered';
export const STATUS_FLOW: OrderStatus[] = ['placed', 'accepted', 'ready', 'picked_up', 'on_the_way', 'delivered'];
export const CUSTOMER_STEPS: { key: OrderStatus; label: string }[] = [
  { key:'placed', label:'Placed' }, { key:'accepted', label:'Store accepted' }, { key:'ready', label:'Packed, ready' },
  { key:'picked_up', label:'Picked up' }, { key:'on_the_way', label:'On the way' }, { key:'delivered', label:'Delivered' },
];
export interface OrderLine { productId: string; name: string; qty: number; price: number; rx?: boolean }
export interface Order {
  id: string; type: 'order' | 'errand'; storeId?: string; customer: string; phone: string; address: string;
  lines: OrderLine[]; subtotal: number; fee: number; total: number;
  /** COD = cash at the door, UPI_DOD = UPI (scan/pay) at the door. 'UPI' = legacy mock-prepaid orders (v0.3). Online prepay: coming soon. */
  pay: PayMode; paymentStatus?: 'due' | 'collected'; collectedVia?: 'cash' | 'upi';
  /** Checkout that was split into one order per store: shared group id, part n of m. The delivery fee is charged once, on part 1. */
  groupId?: string; part?: number; parts?: number; feeNote?: string;
  status: OrderStatus; createdAt: string;
  /** v0.4: the delivery OTP is NOT on the order (riders can read orders). It lives in orderSecrets/{id}; legacy docs may still carry it. */
  otp?: string; deliveryCode?: string; deliveredAt?: string; rider?: string; customerUid?: string; updatedAt?: string;
  /** v0.4: prescription image lives in prescriptions/{id} (not readable by riders); hasRx marks that one was attached. */
  prescriptionUri?: string; hasRxPhoto?: boolean; rxStatus?: 'pending' | 'approved' | 'rejected'; note?: string;
  dropLat?: number; dropLng?: number; customerPushToken?: string;
}
export type Cart = Record<string, number>;
export type PayMode = 'COD' | 'UPI_DOD' | 'UPI';
export const PAY_LABEL: Record<PayMode, string> = { COD: 'Cash on delivery', UPI_DOD: 'UPI on delivery', UPI: 'UPI (prepaid, legacy demo)' };
/** Secrets created together with an order (never stored on the order doc). */
export interface OrderExtras { otp: string; prescription?: string }

export function cartLines(cart: Cart, products: LiveProduct[] = PRODUCTS): OrderLine[] {
  return Object.entries(cart).map(([id, qty]) => { const p = products.find(x => x.id === id); return p && p.inStock !== false && { productId: id, name: p.name, qty, price: p.price, rx: p.rx }; }).filter(Boolean) as OrderLine[];
}
export function cartTotals(cart: Cart, products: LiveProduct[] = PRODUCTS, st: Settings = DEFAULT_SETTINGS) {
  const lines = cartLines(cart, products); const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const fee = deliveryFee(subtotal, st); return { lines, subtotal, fee, total: subtotal + fee, needsRx: lines.some(l => l.rx), min: st.min, free: st.free };
}
const rid = (p: string) => p + Math.floor(1000 + Math.random() * 9000);
export const newOtp = () => String(1000 + Math.floor(Math.random() * 9000));

/** Splits a cart into one order per store (each vendor sees only its part). */
export function buildOrders(cart: Cart, info: { customer: string; phone: string; address: string; pay: PayMode; prescriptionUri?: string; customerUid?: string; dropLat?: number; dropLng?: number; customerPushToken?: string },
  products: LiveProduct[] = PRODUCTS, st: Settings = DEFAULT_SETTINGS): Order[] {
  const byStore: Record<string, OrderLine[]> = {};
  cartLines(cart, products).forEach(l => { const s = products.find(p => p.id === l.productId)!.store; (byStore[s] ||= []).push(l); });
  // ONE delivery fee per checkout, decided on the whole cart (free above st.free), charged on part 1 only and labelled on every part.
  const { fee } = cartTotals(cart, products, st); const groups = Object.entries(byStore); const groupId = rid('G');
  const { prescriptionUri, ...base } = info;
  return groups.map(([storeId, lines], i) => {
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0); const f = i === 0 ? fee : 0;
    const hasRx = lines.some(l => l.rx) || (!!prescriptionUri && lines.some(l => products.find(p => p.id === l.productId)?.cat === 'med'));
    const feeNote = groups.length === 1 ? undefined : i === 0 ? `Delivery fee for all ${groups.length} parts of this checkout` : `Delivery fee charged on part 1`;
    return clean({ id: rid('PD'), type: 'order', storeId, ...base, lines, subtotal, fee: f, total: subtotal + f, paymentStatus: 'due', status: 'placed', createdAt: new Date().toISOString(),
      ...(groups.length > 1 ? { groupId, part: i + 1, parts: groups.length, feeNote } : {}),
      ...(hasRx ? { rxStatus: 'pending', hasRxPhoto: !!prescriptionUri } : {}) }) as Order;
  });
}
const clean = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
/** Order + bill check: subtotal = Σ lines, total = subtotal + fee. */
export const billOk = (o: Order) => o.type === 'errand' || (o.subtotal === o.lines.reduce((a, l) => a + l.price * l.qty, 0) && o.total === o.subtotal + o.fee);
export function buildErrand(i: { pickup: string; drop: string; task: string; price: number; customer: string; phone: string; customerUid?: string; dropLat?: number; dropLng?: number; customerPushToken?: string; pay?: PayMode; rider?: string }): Order {
  return { id: rid('ER'), type: 'errand', customer: i.customer, phone: i.phone, ...(i.customerUid ? { customerUid: i.customerUid } : {}), address: i.drop, note: `${i.task} (pickup: ${i.pickup})`, ...(i.rider ? { rider: i.rider } : {}), dropLat: i.dropLat, dropLng: i.dropLng, customerPushToken: i.customerPushToken,
    lines: [], subtotal: i.price, fee: 0, total: i.price, pay: i.pay ?? 'COD', paymentStatus: 'due', status: 'placed', createdAt: new Date().toISOString() };
}

const DROP = (i: number) => ({ dropLat: 13.0382 + Math.sin(i) * 0.02, dropLng: 80.1565 + Math.cos(i) * 0.02 });
const mk = (id: string, storeId: string, customer: string, address: string, items: [string, number][], status: OrderStatus, pay: PayMode, minsAgo: number, rx?: boolean): Order => {
  const lines = items.map(([pid, qty]) => { const p = PRODUCTS.find(x => x.id === pid)!; return { productId: pid, name: p.name, qty, price: p.price, rx: p.rx }; });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0); const fee = deliveryFee(subtotal);
  return { id, type:'order', storeId, customer, phone:'98400 1' + id.slice(-4), address, lines, subtotal, fee, total: subtotal + fee, pay, status,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(), paymentStatus: 'due', rider: 'r1', ...DROP(+id.slice(-2)), ...(rx ? { prescriptionUri: 'sample', rxStatus: 'pending' as const } : {}) };
};
export const SEED_ORDERS: Order[] = [
  mk('PD1042','s1','Lakshmi R','Ramaniyam Apts, Porur',[['p1',2],['p2',1],['p6',2]],'placed','UPI_DOD',3),
  mk('PD1043','s1','Mohan V','Gerugambakkam 2nd St',[['p4',1],['p5',1]],'accepted','COD',12),
  mk('PD1044','s2','Fathima N','Valasaravakkam',[['p7',2],['p8',5],['p10',1]],'placed','UPI_DOD',5),
  mk('PD1045','s2','Ganesh K','Kundrathur Main Rd',[['p12',1],['p13',2]],'ready','COD',20),
  mk('PD1046','s3','Priya S','Iyyappanthangal',[['p16',1],['p14',2]],'placed','UPI_DOD',2,true),
  mk('PD1047','s3','Senthil Kumar','Ramapuram',[['p15',4],['p17',1]],'delivered','UPI_DOD',95),
];
export const PRODUCT_COUNT = PRODUCTS.length;
