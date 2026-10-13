import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, Order, getApi, LiveProduct, PRODUCTS, Settings, DEFAULT_SETTINGS } from '@porur/shared';

export const ME = { customer: 'You (demo)', phone: '98400 99999' };
export const api = getApi([]);
type Ctx = { cart: Cart; setQty: (id: string, q: number) => void; addMany: (m: Record<string, number>) => void; clear: () => void;
  orders: Order[]; refresh: () => Promise<void>; products: LiveProduct[]; settings: Settings; uid?: string };
const Ctx = createContext<Ctx>(null as any);
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({}); const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<LiveProduct[]>(PRODUCTS); const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS); const [uid, setUid] = useState<string>();
  useEffect(() => { AsyncStorage.getItem('porur.cart').then(c => c && setCart(JSON.parse(c))); }, []);
  useEffect(() => { AsyncStorage.setItem('porur.cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    const subs = [api.watchProducts(p => p.length && setProducts(p)), api.watchSettings(setSettings)];
    let unsubOrders = () => {};
    api.init('customer').then(u => { setUid(u); unsubOrders = api.watchOrders({ customerUid: u }, setOrders); }).catch(e => console.warn('auth', e));
    return () => { subs.forEach(f => f()); unsubOrders(); };
  }, []);
  const setQty = (id: string, q: number) => setCart(c => { const x = { ...c }; if (q <= 0) delete x[id]; else x[id] = Math.round(q * 2) / 2; return x; });
  const addMany = (m: Record<string, number>) => setCart(c => { const x = { ...c }; for (const k in m) x[k] = (x[k] || 0) + m[k]; return x; });
  return <Ctx.Provider value={{ cart, setQty, addMany, clear: () => setCart({}), orders, refresh: async () => {}, products, settings, uid }}>{children}</Ctx.Provider>;
}
