/**
 * API layer. `PorurApi` is implemented by:
 *  - FirestoreApi (./firebase) — real-time sync between customer, vendor, rider & admin (emulator or real project)
 *  - LocalApi — on-device only (AsyncStorage), no sync
 * Pick with backendConfig.backend.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus, SEED_ORDERS, LiveProduct } from './orders';
import { PRODUCTS, RIDERS, Rider } from './catalogue';
import { Settings, DEFAULT_SETTINGS } from './pricing';

export type Role = 'customer' | 'vendor' | 'rider' | 'admin';
export interface AccessRequest { role: 'vendor' | 'rider'; storeId?: string; riderId?: string; note?: string; at: string }
/** users/{uid}. `role` is set ONLY by an admin (rules enforce); no role = customer. */
export interface UserProfile { uid: string; phone: string; name?: string; role?: Role; storeId?: string; riderId?: string; request?: AccessRequest; pushToken?: string; createdAt?: string }
export interface ProductOverride { price?: number; inStock?: boolean }
export interface OrderFilter { storeId?: string; customerUid?: string; rider?: string }
export type Unsub = () => void;
export interface PorurApi {
  init(role?: Role): Promise<string>;             // resolves once signed in
  uid(): string | undefined;
  watchOrders(f: OrderFilter, cb: (o: Order[]) => void): Unsub;
  watchProducts(cb: (p: LiveProduct[]) => void): Unsub;
  watchSettings(cb: (s: Settings) => void): Unsub;
  watchRiders(cb: (r: Rider[]) => void): Unsub;
  createOrders(orders: Order[], opts?: any): Promise<unknown>;
  updateOrder(id: string, patch: Partial<Order>): Promise<void>;
  setStatus(id: string, status: OrderStatus): Promise<void>;
  updateProduct(id: string, patch: ProductOverride): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  updateRider(id: string, patch: Partial<Rider>): Promise<void>;
}

const K = { orders: 'porur.orders.v2', products: 'porur.products.v2', settings: 'porur.settings.v2', riders: 'porur.riders.v2' };
async function read<T>(k: string, fallback: T): Promise<T> { const s = await AsyncStorage.getItem(k); return s ? JSON.parse(s) as T : fallback; }
const write = (k: string, v: unknown) => AsyncStorage.setItem(k, JSON.stringify(v));
const match = (o: Order, f: OrderFilter) => (!f.storeId || o.storeId === f.storeId) && (!f.customerUid || o.customerUid === f.customerUid) && (!f.rider || o.rider === f.rider);
export const sortOrders = (a: Order[]) => [...a].sort((x, y) => y.createdAt.localeCompare(x.createdAt));

export class LocalApi implements PorurApi {
  private subs = new Set<() => void>();
  constructor(private seed: Order[] = SEED_ORDERS) {}
  private emit() { this.subs.forEach(f => f()); }
  private watch<T>(load: () => Promise<T>, cb: (v: T) => void): Unsub { const f = () => { load().then(cb); }; this.subs.add(f); f(); return () => { this.subs.delete(f); }; }
  async init() { return 'local-user'; }
  uid() { return 'local-user'; }
  watchOrders(f: OrderFilter, cb: (o: Order[]) => void) { return this.watch(async () => sortOrders((await read<Order[]>(K.orders, this.seed)).filter(o => match(o, f))), cb); }
  watchProducts(cb: (p: LiveProduct[]) => void) { return this.watch(() => read<LiveProduct[]>(K.products, PRODUCTS.map(p => ({ ...p, inStock: true }))), cb); }
  watchSettings(cb: (s: Settings) => void) { return this.watch(() => read(K.settings, DEFAULT_SETTINGS), cb); }
  watchRiders(cb: (r: Rider[]) => void) { return this.watch(() => read(K.riders, RIDERS), cb); }
  async createOrders(orders: Order[]) { await write(K.orders, [...orders, ...(await read<Order[]>(K.orders, this.seed))]); this.emit(); }
  async updateOrder(id: string, patch: Partial<Order>) { const all = await read<Order[]>(K.orders, this.seed); await write(K.orders, all.map(o => o.id === id ? { ...o, ...patch } : o)); this.emit(); }
  setStatus(id: string, status: OrderStatus) { return this.updateOrder(id, { status }); }
  async updateProduct(id: string, patch: ProductOverride) { const all = await read<LiveProduct[]>(K.products, PRODUCTS.map(p => ({ ...p, inStock: true }))); await write(K.products, all.map(p => p.id === id ? { ...p, ...patch } : p)); this.emit(); }
  async updateSettings(patch: Partial<Settings>) { await write(K.settings, { ...(await read(K.settings, DEFAULT_SETTINGS)), ...patch }); this.emit(); }
  async updateRider(id: string, patch: Partial<Rider>) { const all = await read(K.riders, RIDERS); await write(K.riders, all.map(r => r.id === id ? { ...r, ...patch } : r)); this.emit(); }
}

let api: PorurApi | null = null;
/** Returns the configured API (Firestore by default — see ./config). */
export function getApi(seed?: Order[]): PorurApi {
  if (api) return api;
  const { backendConfig } = require('./config');
  if (backendConfig.backend === 'local') api = new LocalApi(seed);
  else { const { FirestoreApi } = require('./firebase'); api = new FirestoreApi(); }
  return api!;
}
