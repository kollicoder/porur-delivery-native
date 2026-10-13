import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator, Auth } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, Firestore, collection, doc, onSnapshot, query, where, writeBatch, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { backendConfig } from './config';
import type { PorurApi, OrderFilter, ProductOverride, Role, Unsub } from './api';
import { sortOrders } from './api';
import type { Order, OrderStatus, LiveProduct } from './orders';
import type { Rider } from './catalogue';
import { DEFAULT_SETTINGS, Settings } from './pricing';

/** Firestore removes `undefined` poorly — strip it. */
const clean = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o));

export class FirestoreApi implements PorurApi {
  db: Firestore; auth: Auth; private _uid?: string;
  private ready!: Promise<string>; private resolveReady!: (u: string) => void;
  constructor() {
    const app = getApps()[0] || initializeApp(backendConfig.firebase);
    this.auth = getAuth(app);
    // long-polling autodetect makes Firestore work inside React Native
    this.db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    const h = backendConfig.emulatorHost;
    this.ready = new Promise(r => (this.resolveReady = r));
    if (h) { connectAuthEmulator(this.auth, `http://${h}:9099`, { disableWarnings: true }); connectFirestoreEmulator(this.db, h, 8080); }
  }
  async init(role: Role) {
    const cred = this.auth.currentUser ? { user: this.auth.currentUser } : await signInAnonymously(this.auth);
    this._uid = cred.user.uid;
    // Demo role picker: the user's role lives in users/{uid}. Phone-OTP auth + admin-assigned roles come later.
    await setDoc(doc(this.db, 'users', this._uid), { role, updatedAt: new Date().toISOString() }, { merge: true });
    this.resolveReady(this._uid); // writes below wait until sign-in + role are in place
    return this._uid;
  }
  uid() { return this._uid; }
  /** Rules require sign-in, so listeners attach only after init() has finished. */
  private defer(start: () => Unsub): Unsub {
    let unsub: Unsub | undefined, cancelled = false;
    this.ready.then(() => { if (!cancelled) unsub = start(); });
    return () => { cancelled = true; unsub?.(); };
  }
  watchOrders(f: OrderFilter, cb: (o: Order[]) => void): Unsub {
    return this.defer(() => {
    const c: any[] = [];
    if (f.storeId) c.push(where('storeId', '==', f.storeId));
    if (f.customerUid) c.push(where('customerUid', '==', f.customerUid));
    if (f.rider) c.push(where('rider', '==', f.rider));
    return onSnapshot(query(collection(this.db, 'orders'), ...c), s => cb(sortOrders(s.docs.map(d => d.data() as Order))), e => console.warn('orders', e));
    });
  }
  watchProducts(cb: (p: LiveProduct[]) => void): Unsub {
    return this.defer(() => {
    return onSnapshot(collection(this.db, 'products'), s => cb(s.docs.map(d => d.data() as LiveProduct).sort((a, b) => +a.id.slice(1) - +b.id.slice(1))), e => console.warn('products', e));
    });
  }
  watchSettings(cb: (s: Settings) => void): Unsub {
    return this.defer(() => {
    return onSnapshot(doc(this.db, 'settings', 'app'), s => cb({ ...DEFAULT_SETTINGS, ...(s.data() as Partial<Settings>) }), e => console.warn('settings', e));
    });
  }
  watchRiders(cb: (r: Rider[]) => void): Unsub {
    return this.defer(() => {
    return onSnapshot(collection(this.db, 'riders'), s => cb(s.docs.map(d => d.data() as Rider).sort((a, b) => +a.id.slice(1) - +b.id.slice(1))), e => console.warn('riders', e));
    });
  }
  async createOrders(orders: Order[]) {
    await this.ready;
    const b = writeBatch(this.db); const now = new Date().toISOString();
    for (const o of orders) {
      // orders = one doc per store; errands go to the same collection with type 'errand' (+ mirrored in /errands for reporting)
      const d = clean({ ...o, customerUid: o.customerUid ?? this._uid, rider: o.rider ?? 'r1', updatedAt: now });
      b.set(doc(this.db, 'orders', o.id), d);
      if (o.type === 'errand') b.set(doc(this.db, 'errands', o.id), { orderId: o.id, note: o.note ?? '', createdAt: o.createdAt, customerUid: d.customerUid });
    }
    await b.commit();
  }
  async updateOrder(id: string, patch: Partial<Order>) { await this.ready; return updateDoc(doc(this.db, 'orders', id), clean({ ...patch, updatedAt: new Date().toISOString() })); }
  setStatus(id: string, status: OrderStatus) { return this.updateOrder(id, { status }); }
  async updateProduct(id: string, patch: ProductOverride) { await this.ready; return updateDoc(doc(this.db, 'products', id), clean(patch)); }
  async updateSettings(patch: Partial<Settings>) { await this.ready; return setDoc(doc(this.db, 'settings', 'app'), clean(patch), { merge: true }); }
  async updateRider(id: string, patch: Partial<Rider>) { await this.ready; return updateDoc(doc(this.db, 'riders', id), clean(patch)); }
  async isSeeded() { return (await getDoc(doc(this.db, 'settings', 'app'))).exists(); }
}
