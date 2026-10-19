// v0.6 seed documents (used by seed.ts on the emulator and by live-migrate-v06.cjs on study-vignes). Idempotent.
import { FOOD_STORES, FOOD_PRODUCTS, COMMUNITIES, STARTER_SKUS, CLUSTERS, nextCutoffMs, cycleIdFor, METER, DEALS, istDate } from '../packages/shared/src/models';
export function v6SeedDocs(now = Date.now()): [string, any, boolean?][] {
  const cut = nextCutoffMs(now), listId = 'porur-west_' + cycleIdFor(cut);
  const out: [string, any, boolean?][] = [];
  FOOD_STORES.forEach(s => out.push(['stores/' + s.id, { ...s, dealsApproved: true }]));
  FOOD_PRODUCTS.forEach(p => out.push(['products/' + p.id, { ...p, rx: false, inStock: true }]));
  out.push(['stores/s1', { fssaiNo: '22426999000456', dealsApproved: true }, true]);   // fruit & veg vendor may post produce deals
  out.push(['stores/s2', { fssaiNo: '22426999000789', dealsApproved: false }, true]);
  COMMUNITIES.forEach(c => out.push(['communities/' + c.id, c]));
  out.push(['weeklyLists/' + listId, { id: listId, clusterId: 'porur-west', weekOf: istDate(cut - 5 * 864e5), publishedAt: new Date(now).toISOString(), skus: STARTER_SKUS }]);
  out.push(['meters/M-porur-west-1', { id: 'M-porur-west-1', clusterId: 'porur-west', clusterName: CLUSTERS['porur-west'], cycleId: cycleIdFor(cut), listId, threshold: METER.threshold,
    count: 0, status: 'open', openedAt: new Date(now).toISOString(), openedMs: now, cutoffAt: new Date(cut).toISOString(), cutoffMs: cut }]);
  out.push(['settings/deals', { killAll: false, anyTime: true, fromHour: DEALS.fromHour, toHour: DEALS.toHour }]);
  return out;
}
