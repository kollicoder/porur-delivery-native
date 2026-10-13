export interface Settings { fee: number; min: number; free: number; radius: number; nightFrom: string; nightTo: string; nightMedOnly: boolean; errandBase: number; errandHour: number; errandPerKm: number; zones: Record<string, boolean> }
export const DEFAULT_SETTINGS: Settings = { fee: 25, min: 199, free: 499, radius: 5, nightFrom: '23:00', nightTo: '06:00', nightMedOnly: true, errandBase: 99, errandHour: 249, errandPerKm: 12,
  zones: { Porur: true, Ramapuram: true, Valasaravakkam: true, Mangadu: false, Iyyappanthangal: true } };
// Back-compat constants (defaults). Live values come from Settings.
export const MIN_ORDER = DEFAULT_SETTINGS.min, DELIVERY_FEE = DEFAULT_SETTINGS.fee, FREE_DELIVERY_ABOVE = DEFAULT_SETTINGS.free;
export const ERRAND_BASE = 99, ERRAND_BASE_KM = 3, ERRAND_PER_KM = 12, ERRAND_HOURLY = 249;
export const deliveryFee = (subtotal: number, st: Settings = DEFAULT_SETTINGS) => (subtotal === 0 || subtotal >= st.free ? 0 : st.fee);
export const errandPrice = (mode: 'trip' | 'hour', km: number, hours: number, st: Settings = DEFAULT_SETTINGS) =>
  mode === 'trip' ? st.errandBase + Math.max(0, Math.ceil(km - ERRAND_BASE_KM)) * st.errandPerKm : st.errandHour * hours;
export const rs = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
