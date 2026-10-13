/**
 * API layer. Today: LocalApi stores everything on-device (AsyncStorage).
 * Later: implement `PorurApi` with HTTP calls (e.g. HttpApi(baseUrl)) and swap it in `getApi()`.
 * NOTE: the customer and vendor apps each keep their OWN local data — real cross-app sync needs a backend.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, OrderStatus, SEED_ORDERS } from './orders';
import { PRODUCTS } from './catalogue';

export interface ProductOverride { price?: number; inStock?: boolean }
export interface PorurApi {
  listOrders(filter?: { storeId?: string; customer?: string }): Promise<Order[]>;
  createOrders(orders: Order[]): Promise<void>;
  updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined>;
  setStatus(id: string, status: OrderStatus): Promise<Order | undefined>;
  getOverrides(): Promise<Record<string, ProductOverride>>;
  setOverride(productId: string, o: ProductOverride): Promise<void>;
  reset(): Promise<void>;
}
const K = { orders: 'porur.orders.v1', overrides: 'porur.overrides.v1' };
async function read<T>(k: string, fallback: T): Promise<T> { const s = await AsyncStorage.getItem(k); return s ? JSON.parse(s) as T : fallback; }
const write = (k: string, v: unknown) => AsyncStorage.setItem(k, JSON.stringify(v));

export class LocalApi implements PorurApi {
  constructor(private seed: Order[] = SEED_ORDERS) {}
  private all() { return read<Order[]>(K.orders, this.seed); }
  async listOrders(f: { storeId?: string; customer?: string } = {}) {
    return (await this.all()).filter(o => (!f.storeId || o.storeId === f.storeId) && (!f.customer || o.customer === f.customer))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async createOrders(orders: Order[]) { await write(K.orders, [...orders, ...(await this.all())]); }
  async updateOrder(id: string, patch: Partial<Order>) {
    const all = await this.all(); const i = all.findIndex(o => o.id === id); if (i < 0) return;
    all[i] = { ...all[i], ...patch }; await write(K.orders, all); return all[i];
  }
  setStatus(id: string, status: OrderStatus) { return this.updateOrder(id, { status }); }
  getOverrides() { return read<Record<string, ProductOverride>>(K.overrides, {}); }
  async setOverride(pid: string, o: ProductOverride) { const all = await this.getOverrides(); all[pid] = { ...all[pid], ...o }; await write(K.overrides, all); }
  async reset() { await AsyncStorage.removeItem(K.orders); await AsyncStorage.removeItem(K.overrides); }
}
let api: PorurApi | null = null;
export const getApi = (seed?: Order[]) => (api ||= new LocalApi(seed));
export const effectiveProducts = (ov: Record<string, ProductOverride>) =>
  PRODUCTS.map(p => ({ ...p, price: ov[p.id]?.price ?? p.price, inStock: ov[p.id]?.inStock ?? true }));
