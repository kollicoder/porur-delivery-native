export const MIN_ORDER = 199, DELIVERY_FEE = 25, FREE_DELIVERY_ABOVE = 499;
export const ERRAND_BASE = 99, ERRAND_BASE_KM = 3, ERRAND_PER_KM = 12, ERRAND_HOURLY = 249;
export const deliveryFee = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE);
export const errandPrice = (mode: 'trip' | 'hour', km: number, hours: number) =>
  mode === 'trip' ? ERRAND_BASE + Math.max(0, Math.ceil(km - ERRAND_BASE_KM)) * ERRAND_PER_KM : ERRAND_HOURLY * hours;
export const rs = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
