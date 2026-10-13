import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi, SEED_ORDERS, Order, STORES, Store, LiveProduct, PRODUCTS } from '@porur/shared';
export const api = getApi(SEED_ORDERS);
type Ctx = { store?: Store; setStoreId: (id?: string) => void; orders: Order[]; refresh: () => Promise<void>; products: LiveProduct[]; ready: boolean };
const Ctx = createContext<Ctx>(null as any); export const useVendor = () => useContext(Ctx);
export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setSid] = useState<string>(); const [orders, setOrders] = useState<Order[]>([]); const [products, setProducts] = useState<LiveProduct[]>(PRODUCTS);
  const [ready, setReady] = useState(false); const [authed, setAuthed] = useState(false);
  useEffect(() => { AsyncStorage.getItem('porur.vendor.store').then(v => { if (v) setSid(v); setReady(true); }); }, []);
  useEffect(() => { api.init('vendor').then(() => setAuthed(true)).catch(e => console.warn('auth', e)); }, []);
  useEffect(() => { if (!authed) return; return api.watchProducts(p => p.length && setProducts(p)); }, [authed]);
  useEffect(() => { if (!authed || !storeId) return; return api.watchOrders({ storeId }, setOrders); }, [authed, storeId]);
  const setStoreId = (id?: string) => { setSid(id); id ? AsyncStorage.setItem('porur.vendor.store', id) : AsyncStorage.removeItem('porur.vendor.store'); };
  return <Ctx.Provider value={{ store: STORES.find(s => s.id === storeId), setStoreId, orders, refresh: async () => {}, products, ready }}>{children}</Ctx.Provider>;
}
export const useProducts = () => { const { store, products } = useVendor(); return products.filter(p => p.store === store?.id); };
