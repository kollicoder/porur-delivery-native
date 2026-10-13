import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, connectAuthEmulator, Auth, signInWithPhoneNumber, ConfirmationResult, ApplicationVerifier, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, Firestore, collection, doc, onSnapshot, query, where, writeBatch, updateDoc, setDoc, getDoc, deleteField } from 'firebase/firestore';
import { backendConfig } from './config';
import type { PorurApi, OrderFilter, ProductOverride, Role, Unsub, UserProfile, AccessRequest } from './api';
import { sortOrders } from './api';
import type { Order, OrderStatus, LiveProduct } from './orders';
import type { Rider } from './catalogue';
import { DEFAULT_SETTINGS, Settings } from './pricing';

/** Firestore removes `undefined` poorly — strip it. */
const clean = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o));
const isRN = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';

function makeAuth(app: FirebaseApp): Auth {
  if (!isRN) return getAuth(app);
  try { // keep RN users signed in across app restarts
    const { getReactNativePersistence } = require('firebase/auth');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch { return getAuth(app); }
}

/** For non-DOM environments (tests / emulator / Firebase test numbers with app verification disabled). */
export const testVerifier = { type: 'recaptcha', verify: async () => 'test-token', _reset() {} } as unknown as ApplicationVerifier;

export class FirestoreApi implements PorurApi {
  db: Firestore; auth: Auth; private _uid?: string; private confirmation?: ConfirmationResult;
  private ready!: Promise<string>; private resolveReady!: (u: string) => void;
  readonly emulator: boolean;
  constructor(appName?: string) {
    const app = appName ? initializeApp(backendConfig.firebase, appName) : (getApps()[0] || initializeApp(backendConfig.firebase));
    this.auth = makeAuth(app);
    // long-polling autodetect makes Firestore work inside React Native
    this.db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
    const h = backendConfig.emulatorHost; this.emulator = !!h;
    this.resetReady();
    if (h) {
      connectAuthEmulator(this.auth, `http://${h}:9099`, { disableWarnings: true }); connectFirestoreEmulator(this.db, h, 8080);
      this.auth.settings.appVerificationDisabledForTesting = true; // emulator: no reCAPTCHA
    }
    // Web export: ?test=1 enables Firebase *test phone numbers* without reCAPTCHA (real numbers still require it).
    try { if (typeof location !== 'undefined' && /[?&]test=1/.test(location.search || '')) localStorage.setItem('pd_test', '1');
      if (typeof localStorage !== 'undefined' && localStorage.getItem('pd_test') === '1') this.auth.settings.appVerificationDisabledForTesting = true; } catch {}
  }
  private resetReady() { this.ready = new Promise(r => (this.resolveReady = r)); }

  // ---------- Auth (phone OTP) ----------
  /** Calls cb with the signed-in user (or null). Resolves listeners/writes once a phone user + profile exist. */
  onAuth(cb: (u: User | null) => void): Unsub {
    return onAuthStateChanged(this.auth, async u => {
      if (u && u.phoneNumber) { this._uid = u.uid; await this.ensureProfile(u); this.resolveReady(u.uid); }
      else { this._uid = undefined; }
      cb(u && u.phoneNumber ? u : null);
    });
  }
  async sendCode(phone: string, verifier: ApplicationVerifier) { this.confirmation = await signInWithPhoneNumber(this.auth, phone, verifier); }
  async confirmCode(code: string) { if (!this.confirmation) throw new Error('Send the code first'); await this.confirmation.confirm(code); }
  async logout() { await signOut(this.auth); this.resetReady(); }
  private async ensureProfile(u: User) {
    const ref = doc(this.db, 'users', u.uid);
    if (!(await getDoc(ref)).exists()) await setDoc(ref, { phone: u.phoneNumber, createdAt: new Date().toISOString() });
  }
  async init(_role?: Role) { return this.ready; } // back-compat: waits for phone sign-in
  uid() { return this._uid; }
  watchMe(cb: (p: UserProfile | null) => void): Unsub {
    return this.defer(() => onSnapshot(doc(this.db, 'users', this._uid!), s => cb(s.exists() ? ({ uid: s.id, ...s.data() } as UserProfile) : null), e => console.warn('me', e)));
  }
  async updateMe(patch: { name?: string; pushToken?: string; request?: AccessRequest | null }) {
    await this.ready;
    const p: any = { ...patch, updatedAt: new Date().toISOString() };
    if (patch.request === null) p.request = deleteField();
    return updateDoc(doc(this.db, 'users', this._uid!), p);
  }
  // admin
  watchUsers(cb: (u: UserProfile[]) => void): Unsub {
    return this.defer(() => onSnapshot(collection(this.db, 'users'), s => cb(s.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))), e => console.warn('users', e)));
  }
  async setUserRole(uid: string, role: Role | null, extra: { storeId?: string; riderId?: string } = {}) {
    await this.ready;
    return updateDoc(doc(this.db, 'users', uid), { role: role ?? deleteField(), storeId: extra.storeId ?? deleteField(), riderId: extra.riderId ?? deleteField(), request: deleteField(), updatedAt: new Date().toISOString() });
  }

  /** Rules require sign-in, so listeners attach only after sign-in. */
  private defer(start: () => Unsub): Unsub {
    let unsub: Unsub | undefined, cancelled = false;
    this.ready.then(() => { if (!cancelled) unsub = start(); });
    return () => { cancelled = true; unsub?.(); };
  }
  watchOrders(f: OrderFilter, cb: (o: Order[]) => void): Unsub {
    return this.defer(() => {
      const c: any[] = [];
      if (f.storeId) c.push(where('storeId', '==', f.storeId));
      if (f.customerUid) c.push(where('customerUid', '==', f.customerUid === 'me' ? this._uid : f.customerUid));
      if (f.rider) c.push(where('rider', '==', f.rider));
      return onSnapshot(query(collection(this.db, 'orders'), ...c), s => cb(sortOrders(s.docs.map(d => d.data() as Order))), e => console.warn('orders', e));
    });
  }
  watchProducts(cb: (p: LiveProduct[]) => void): Unsub {
    return this.defer(() => onSnapshot(collection(this.db, 'products'), s => cb(s.docs.map(d => d.data() as LiveProduct).sort((a, b) => +a.id.slice(1) - +b.id.slice(1))), e => console.warn('products', e)));
  }
  watchSettings(cb: (s: Settings) => void): Unsub {
    return this.defer(() => onSnapshot(doc(this.db, 'settings', 'app'), s => cb({ ...DEFAULT_SETTINGS, ...(s.data() as Partial<Settings>) }), e => console.warn('settings', e)));
  }
  watchRiders(cb: (r: Rider[]) => void): Unsub {
    return this.defer(() => onSnapshot(collection(this.db, 'riders'), s => cb(s.docs.map(d => d.data() as Rider).sort((a, b) => +a.id.slice(1) - +b.id.slice(1))), e => console.warn('riders', e)));
  }
  async createOrders(orders: Order[]) {
    await this.ready;
    const b = writeBatch(this.db); const now = new Date().toISOString();
    for (const o of orders) {
      const d = clean({ ...o, customerUid: this._uid, rider: o.rider ?? 'r1', updatedAt: now });
      b.set(doc(this.db, 'orders', o.id), d);
      if (o.type === 'errand') b.set(doc(this.db, 'errands', o.id), { orderId: o.id, note: o.note ?? '', createdAt: o.createdAt, customerUid: this._uid });
    }
    await b.commit();
  }
  async updateOrder(id: string, patch: Partial<Order>) { await this.ready; return updateDoc(doc(this.db, 'orders', id), clean({ ...patch, updatedAt: new Date().toISOString() })); }
  setStatus(id: string, status: OrderStatus) { return this.updateOrder(id, { status }); }
  async updateProduct(id: string, patch: ProductOverride) { await this.ready; return updateDoc(doc(this.db, 'products', id), clean(patch)); }
  async updateSettings(patch: Partial<Settings>) { await this.ready; return setDoc(doc(this.db, 'settings', 'app'), clean(patch), { merge: true }); }
  async updateRider(id: string, patch: Partial<Rider>) { await this.ready; return updateDoc(doc(this.db, 'riders', id), clean(patch)); }
}
