import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { getApi, SEED_ORDERS, Order, STORES, Store, LiveProduct, PRODUCTS, UserProfile, Rider, RIDERS } from '@porur/shared';
import type { FirestoreApi } from '@porur/shared/src/firebase';
import { setupNotifications, localNotify } from '@porur/shared/src/ui/notify';
export const api = getApi(SEED_ORDERS) as FirestoreApi;
type Ctx = { store?: Store; setStoreId: (id?: string) => void; orders: Order[]; refresh: () => Promise<void>; products: LiveProduct[]; ready: boolean;
  user?: User | null; me?: UserProfile | null; riders: Rider[]; ordersReady: boolean };
const Ctx = createContext<Ctx>(null as any); export const useVendor = () => useContext(Ctx);
export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]); const [products, setProducts] = useState<LiveProduct[]>(PRODUCTS);
  const [user, setUser] = useState<User | null | undefined>(undefined); const [me, setMe] = useState<UserProfile | null | undefined>(undefined);
  useEffect(() => api.onAuth(u => { setUser(u); if (!u) setMe(null); }), []);
  const [riders, setRiders] = useState<Rider[]>(RIDERS); const [ordersReady, setOrdersReady] = useState(false);
  useEffect(() => { if (!user) return; return api.watchMe(setMe); }, [user]);
  // Role comes only from users/{uid} written by the admin (rules block self-assignment)
  const storeId = me?.role === 'vendor' || me?.role === 'admin' ? me?.storeId : undefined;
  useEffect(() => { if (!storeId) return; return api.watchProducts(p => p.length && setProducts(p)); }, [storeId]);
  useEffect(() => { if (!storeId) return; return api.watchOrders({ storeId }, o => { setOrders(o); setOrdersReady(true); }); }, [storeId]);
  useEffect(() => { if (!storeId) return; return api.watchRiders(r => r.length && setRiders(r)); }, [storeId]);
  // Push token registered against this store, so customers' phones can notify it even when the app is closed
  useEffect(() => { if (!storeId) return; setupNotifications().then(r => { if (r.pushToken) api.registerPushToken(r.pushToken, me).catch(e => console.warn('push reg', e)); }).catch(() => {}); }, [storeId]);
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => { const prev = seen.current; seen.current = new Set(orders.map(o => o.id));
    if (prev) orders.forEach(o => { if (!prev.has(o.id) && o.status === 'placed') localNotify('🛎️ New order ' + o.id, `${o.customer} · ₹${o.total}`); }); }, [orders.map(o => o.id).join()]);
  const ready = user !== undefined && (user === null || me !== undefined);
  return <Ctx.Provider value={{ store: STORES.find(s => s.id === storeId), setStoreId: () => { api.logout(); }, orders, refresh: async () => {}, products, ready, user, me, riders, ordersReady }}>{children}</Ctx.Provider>;
}
export const useProducts = () => { const { store, products } = useVendor(); return products.filter(p => p.store === store?.id); };
