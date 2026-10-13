import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, Order, getApi, effectiveProducts, ProductOverride } from '@porur/shared';

export const ME = { customer: 'You (demo)', phone: '98400 99999' };
export const api = getApi([]); // customer starts with no orders
type Ctx = { cart: Cart; setQty: (id: string, q: number) => void; addMany: (m: Record<string, number>) => void; clear: () => void;
  orders: Order[]; refresh: () => Promise<void>; products: ReturnType<typeof effectiveProducts> };
const Ctx = createContext<Ctx>(null as any);
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({}); const [orders, setOrders] = useState<Order[]>([]); const [ov, setOv] = useState<Record<string, ProductOverride>>({});
  useEffect(() => { AsyncStorage.getItem('porur.cart').then(c => c && setCart(JSON.parse(c))); }, []);
  useEffect(() => { AsyncStorage.setItem('porur.cart', JSON.stringify(cart)); }, [cart]);
  const refresh = useCallback(async () => { setOrders(await api.listOrders({ customer: ME.customer })); setOv(await api.getOverrides()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setQty = (id: string, q: number) => setCart(c => { const x = { ...c }; if (q <= 0) delete x[id]; else x[id] = Math.round(q * 2) / 2; return x; });
  const addMany = (m: Record<string, number>) => setCart(c => { const x = { ...c }; for (const k in m) x[k] = (x[k] || 0) + m[k]; return x; });
  return <Ctx.Provider value={{ cart, setQty, addMany, clear: () => setCart({}), orders, refresh, products: effectiveProducts(ov) }}>{children}</Ctx.Provider>;
}
