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
  lines: OrderLine[]; subtotal: number; fee: number; total: number; pay: 'UPI' | 'COD';
  status: OrderStatus; createdAt: string; otp: string; rider?: string; customerUid?: string; updatedAt?: string;
  prescriptionUri?: string; rxStatus?: 'pending' | 'approved' | 'rejected'; note?: string;
}
export type Cart = Record<string, number>;

export function cartLines(cart: Cart, products: LiveProduct[] = PRODUCTS): OrderLine[] {
  return Object.entries(cart).map(([id, qty]) => { const p = products.find(x => x.id === id); return p && p.inStock !== false && { productId: id, name: p.name, qty, price: p.price, rx: p.rx }; }).filter(Boolean) as OrderLine[];
}
export function cartTotals(cart: Cart, products: LiveProduct[] = PRODUCTS, st: Settings = DEFAULT_SETTINGS) {
  const lines = cartLines(cart, products); const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const fee = deliveryFee(subtotal, st); return { lines, subtotal, fee, total: subtotal + fee, needsRx: lines.some(l => l.rx), min: st.min, free: st.free };
}
const rid = (p: string) => p + Math.floor(1000 + Math.random() * 9000);
const otp = () => String(1000 + Math.floor(Math.random() * 9000));

/** Splits a cart into one order per store (each vendor sees only its part). */
export function buildOrders(cart: Cart, info: { customer: string; phone: string; address: string; pay: 'UPI'|'COD'; prescriptionUri?: string; customerUid?: string },
  products: LiveProduct[] = PRODUCTS, st: Settings = DEFAULT_SETTINGS): Order[] {
  const byStore: Record<string, OrderLine[]> = {};
  cartLines(cart, products).forEach(l => { const s = products.find(p => p.id === l.productId)!.store; (byStore[s] ||= []).push(l); });
  const { fee } = cartTotals(cart, products, st); let feeLeft = fee;
  return Object.entries(byStore).map(([storeId, lines]) => {
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0); const f = feeLeft; feeLeft = 0;
    const hasRx = lines.some(l => l.rx);
    return { id: rid('PD'), type: 'order', storeId, ...info, lines, subtotal, fee: f, total: subtotal + f, status: 'placed', createdAt: new Date().toISOString(), otp: otp(),
      ...(hasRx ? { prescriptionUri: info.prescriptionUri ?? null, rxStatus: 'pending' } : {}) } as Order;
  });
}
export function buildErrand(i: { pickup: string; drop: string; task: string; price: number; customer: string; phone: string; customerUid?: string }): Order {
  return { id: rid('ER'), type: 'errand', customer: i.customer, phone: i.phone, ...(i.customerUid ? { customerUid: i.customerUid } : {}), address: i.drop, note: `${i.task} (pickup: ${i.pickup})`,
    lines: [], subtotal: i.price, fee: 0, total: i.price, pay: 'UPI', status: 'placed', createdAt: new Date().toISOString(), otp: otp() };
}

const mk = (id: string, storeId: string, customer: string, address: string, items: [string, number][], status: OrderStatus, pay: 'UPI'|'COD', minsAgo: number, rx?: boolean): Order => {
  const lines = items.map(([pid, qty]) => { const p = PRODUCTS.find(x => x.id === pid)!; return { productId: pid, name: p.name, qty, price: p.price, rx: p.rx }; });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0); const fee = deliveryFee(subtotal);
  return { id, type:'order', storeId, customer, phone:'98400 1' + id.slice(-4), address, lines, subtotal, fee, total: subtotal + fee, pay, status,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(), otp: '4821', rider: 'r1', ...(rx ? { prescriptionUri: 'sample', rxStatus: 'pending' as const } : {}) };
};
export const SEED_ORDERS: Order[] = [
  mk('PD1042','s1','Lakshmi R','Ramaniyam Apts, Porur',[['p1',2],['p2',1],['p6',2]],'placed','UPI',3),
  mk('PD1043','s1','Mohan V','Gerugambakkam 2nd St',[['p4',1],['p5',1]],'accepted','COD',12),
  mk('PD1044','s2','Fathima N','Valasaravakkam',[['p7',2],['p8',5],['p10',1]],'placed','UPI',5),
  mk('PD1045','s2','Ganesh K','Kundrathur Main Rd',[['p12',1],['p13',2]],'ready','COD',20),
  mk('PD1046','s3','Priya S','Iyyappanthangal',[['p16',1],['p14',2]],'placed','UPI',2,true),
  mk('PD1047','s3','Senthil Kumar','Ramapuram',[['p15',4],['p17',1]],'delivered','UPI',95),
];
export const PRODUCT_COUNT = PRODUCTS.length;
