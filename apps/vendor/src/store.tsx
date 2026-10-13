import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { getApi, SEED_ORDERS, Order, STORES, Store, LiveProduct, PRODUCTS, UserProfile } from '@porur/shared';
import type { FirestoreApi } from '@porur/shared/src/firebase';
import { setupNotifications, localNotify } from '@porur/shared/src/ui/notify';
export const api = getApi(SEED_ORDERS) as FirestoreApi;
type Ctx = { store?: Store; setStoreId: (id?: string) => void; orders: Order[]; refresh: () => Promise<void>; products: LiveProduct[]; ready: boolean;
  user?: User | null; me?: UserProfile | null };
const Ctx = createContext<Ctx>(null as any); export const useVendor = () => useContext(Ctx);
export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]); const [products, setProducts] = useState<LiveProduct[]>(PRODUCTS);
  const [user, setUser] = useState<User | null | undefined>(undefined); const [me, setMe] = useState<UserProfile | null | undefined>(undefined);
  useEffect(() => api.onAuth(u => { setUser(u); if (!u) setMe(null); }), []);
  useEffect(() => { if (!user) return; setupNotifications().catch(() => {}); return api.watchMe(setMe); }, [user]);
  // Role comes only from users/{uid} written by the admin (rules block self-assignment)
  const storeId = me?.role === 'vendor' || me?.role === 'admin' ? me?.storeId : undefined;
  useEffect(() => { if (!storeId) return; return api.watchProducts(p => p.length && setProducts(p)); }, [storeId]);
  useEffect(() => { if (!storeId) return; return api.watchOrders({ storeId }, setOrders); }, [storeId]);
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => { const prev = seen.current; seen.current = new Set(orders.map(o => o.id));
    if (prev) orders.forEach(o => { if (!prev.has(o.id) && o.status === 'placed') localNotify('🛎️ New order ' + o.id, `${o.customer} · ₹${o.total}`); }); }, [orders.map(o => o.id).join()]);
  const ready = user !== undefined && (user === null || me !== undefined);
  return <Ctx.Provider value={{ store: STORES.find(s => s.id === storeId), setStoreId: () => { api.logout(); }, orders, refresh: async () => {}, products, ready, user, me }}>{children}</Ctx.Provider>;
}
export const useProducts = () => { const { store, products } = useVendor(); return products.filter(p => p.store === store?.id); };
