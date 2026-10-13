import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApi, SEED_ORDERS, Order, STORES, Store, effectiveProducts, ProductOverride } from '@porur/shared';
export const api = getApi(SEED_ORDERS);
type Ctx = { store?: Store; setStoreId: (id?: string) => void; orders: Order[]; refresh: () => Promise<void>; ov: Record<string, ProductOverride>; ready: boolean };
const Ctx = createContext<Ctx>(null as any); export const useVendor = () => useContext(Ctx);
export function VendorProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setSid] = useState<string>(); const [orders, setOrders] = useState<Order[]>([]); const [ov, setOv] = useState<Record<string, ProductOverride>>({}); const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem('porur.vendor.store').then(v => { if (v) setSid(v); setReady(true); }); }, []);
  const setStoreId = (id?: string) => { setSid(id); id ? AsyncStorage.setItem('porur.vendor.store', id) : AsyncStorage.removeItem('porur.vendor.store'); };
  const refresh = useCallback(async () => { if (!storeId) return; setOrders(await api.listOrders({ storeId })); setOv(await api.getOverrides()); }, [storeId]);
  useEffect(() => { refresh(); }, [refresh]);
  return <Ctx.Provider value={{ store: STORES.find(s => s.id === storeId), setStoreId, orders, refresh, ov, ready }}>{children}</Ctx.Provider>;
}
export const useProducts = () => { const { store, ov } = useVendor(); return effectiveProducts(ov).filter(p => p.store === store?.id); };
