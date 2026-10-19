import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from 'firebase/auth';
import { Cart, Order, getApi, LiveProduct, PRODUCTS, Settings, DEFAULT_SETTINGS, Rider, RIDERS, UserProfile } from '@porur/shared';
import type { FirestoreApi } from '@porur/shared/src/firebase';
import { setupNotifications, localNotify, STATUS_TEXT } from '@porur/shared/src/ui/notify';
import { shouldPush, Deal, DealPrefs } from '@porur/shared';

export const api = getApi([]) as FirestoreApi;
export const ME = { customer: 'Customer', phone: '' };
type Ctx = { cart: Cart; setQty: (id: string, q: number) => void; addMany: (m: Record<string, number>) => void; clear: () => void;
  orders: Order[]; refresh: () => Promise<void>; products: LiveProduct[]; settings: Settings; uid?: string; user?: User | null; me?: UserProfile | null;
  riders: Rider[]; pushToken?: string; who: { customer: string; phone: string }; ordersReady: boolean; productsReady: boolean; lang: Lang; setLang: (l: Lang) => void; t: (en: string, ta: string) => string };
export type Lang = 'en' | 'ta';
const Ctx = createContext<Ctx>(null as any);
export const useApp = () => useContext(Ctx);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({}); const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<LiveProduct[]>(PRODUCTS); const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<User | null | undefined>(undefined); const [me, setMe] = useState<UserProfile | null>(null);
  const [riders, setRiders] = useState<Rider[]>(RIDERS); const [ordersReady, setOrdersReady] = useState(false); const [productsReady, setProductsReady] = useState(false); const [lang, setLangS] = useState<Lang>('en'); const [pushToken, setPushToken] = useState<string>();
  useEffect(() => { AsyncStorage.getItem('porur.lang').then(l => (l === 'ta' || l === 'en') && setLangS(l)); }, []);
  useEffect(() => { AsyncStorage.getItem('porur.cart').then(c => c && setCart(JSON.parse(c))); }, []);
  useEffect(() => { AsyncStorage.setItem('porur.cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => api.onAuth(setUser), []);
  useEffect(() => {
    if (!user) return;
    const subs = [api.watchProducts(p => { setProductsReady(true); if (p.length) setProducts(p.filter(x => (x.cat as string) !== 'food')); /* v0.6: food items only appear as flash deals */ }), api.watchSettings(setSettings), api.watchRiders(r => r.length && setRiders(r)),
      api.watchOrders({ customerUid: 'me' }, o => { setOrders(o); setOrdersReady(true); }), api.watchMe(setMe)];
    setupNotifications().then(r => { if (r.pushToken) { setPushToken(r.pushToken); api.updateMe({ pushToken: r.pushToken }).catch(() => {}); api.registerPushToken(r.pushToken).catch(() => {}); } }).catch(() => {});
    return () => subs.forEach(f => f());
  }, [user]);
  // v0.6: in-app deal alert while the app is open (same rules as the server push: opted in, within radius, veg pref, once a day, quiet after 10:30 pm)
  useEffect(() => {
    if (!user) return; let prefs: DealPrefs | null = null; const seenD = new Set<string>(); let first = true;
    const a = api.models.watchPrefs(p => { prefs = p; });
    const b = api.models.watchLiveDeals((ds: Deal[]) => { const fresh = ds.filter(d => !seenD.has(d.id)); ds.forEach(d => seenD.add(d.id)); if (first) { first = false; return; }
      const d = fresh.find(x => prefs && !shouldPush(prefs, x)); if (!d || !prefs) return;
      localNotify(`🔥 ${d.discountPct}% off ${d.item}`, `${d.storeName} · ₹${d.dealPrice} · only ${d.qtyLeft} left`); });
    return () => { a(); b(); };
  }, [user]);
  // Local notification when one of my orders changes status
  const seen = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const prev = seen.current; seen.current = Object.fromEntries(orders.map(o => [o.id, o.status]));
    if (prev) orders.forEach(o => { if (prev[o.id] && prev[o.id] !== o.status) localNotify(`Order ${o.id}`, STATUS_TEXT[o.status] || o.status); });
  }, [orders.map(o => o.id + o.status).join()]);
  const setQty = (id: string, q: number) => setCart(c => { const x = { ...c }; if (q <= 0) delete x[id]; else x[id] = Math.round(q * 2) / 2; return x; });
  const addMany = (m: Record<string, number>) => setCart(c => { const x = { ...c }; for (const k in m) x[k] = (x[k] || 0) + m[k]; return x; });
  useEffect(() => { (api as any)._name = me?.name || user?.phoneNumber || 'Customer'; }, [me?.name, user?.phoneNumber]);
  const who = { customer: me?.name || user?.phoneNumber || 'Customer', phone: user?.phoneNumber || '' };
  return <Ctx.Provider value={{ cart, setQty, addMany, clear: () => setCart({}), orders, refresh: async () => {}, products, settings, uid: user?.uid, user, me, riders, pushToken, who, ordersReady, productsReady, lang, setLang: (l: Lang) => { setLangS(l); AsyncStorage.setItem('porur.lang', l); }, t: (en: string, ta: string) => lang === 'ta' ? ta : en }}>{children}</Ctx.Provider>;
}
