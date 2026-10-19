/**
 * Porur v0.6 Cloud Functions — kept tiny and near-zero cost (Blaze plan, ₹1,000/month kill-switch on the billing account).
 * Region us-central1: Firestore-triggered functions must run where the database is (study-vignes Firestore = nam5 multi-region).
 * maxInstances 1, 256 MiB, no min instances → idle cost ₹0; a few hundred invocations a day stay inside the free tier.
 *  - dealFanout:  a flash deal goes live → Expo push to opted-in users within 3 km (veg pref, max 1/day, none after 10:30 pm IST).
 *  - dealQuality: a deal claim is rated / gets a complaint → vendor quality score; auto-pause below 4.0 or ≥2 complaints in 7 days.
 *  - jobRating:   a home-service job is rated → pro rating & jobs done.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { shouldPush, vendorQuality, istDayNo, Deal, DealPrefs } from '../../../packages/shared/src/models';
setGlobalOptions({ region: 'us-central1', maxInstances: 1, memory: '256MiB', timeoutSeconds: 60 });
initializeApp(); const db = getFirestore();

export const dealFanout = onDocumentCreated('deals/{id}', async ev => {
  const deal = ev.data?.data() as Deal | undefined; if (!deal || deal.status !== 'live') return;
  const now = Date.now(); const log: Record<string, number> = {}; const send: { uid: string; token: string }[] = [];
  const prefs = await db.collection('dealPrefs').where('optIn', '==', true).limit(2000).get();
  for (const d of prefs.docs) { const why = shouldPush(d.data() as DealPrefs, deal, now); if (why) { log[why] = (log[why] || 0) + 1; continue; }
    const t = await db.doc('pushTokens/' + d.id).get(); const token = t.exists ? (t.data() as any).token : '';
    if (!token || !String(token).startsWith('ExponentPushToken')) { log['no device token'] = (log['no device token'] || 0) + 1; continue; } send.push({ uid: d.id, token }); }
  const title = `🔥 ${deal.discountPct}% off ${deal.item} · ${deal.storeName}`;
  const body = `₹${deal.dealPrice} (was ₹${deal.regularPrice}) · only ${deal.qtyLeft} · ends in ${Math.round((deal.expiresAtMs - now) / 60000)} min. Pickup${deal.fulfil === 'both' ? ' or ₹39 delivery' : ''}.`;
  let sent = 0, errors = 0;
  for (let i = 0; i < send.length; i += 100) { // Expo push API: ≤100 messages per request
    const chunk = send.slice(i, i + 100);
    try { const r = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk.map(c => ({ to: c.token, title, body, sound: 'default', channelId: 'orders', priority: 'high', data: { dealId: deal.id, url: 'porurdelivery://deals' } }))) });
      if (r.ok) sent += chunk.length; else errors += chunk.length; } catch { errors += chunk.length; }
    const b = db.batch(); chunk.forEach(c => b.set(db.doc('dealPrefs/' + c.uid), { lastPushDay: istDayNo(now), lastDealPushAt: new Date(now).toISOString() }, { merge: true })); await b.commit();
  }
  await db.doc('pushLog/' + ev.params.id).set({ dealId: ev.params.id, storeId: deal.storeId, candidates: prefs.size, sent, errors, skipped: log, at: new Date(now).toISOString() });
});

export const dealQuality = onDocumentUpdated('dealClaims/{id}', async ev => {
  const a = ev.data?.before.data(), b = ev.data?.after.data(); if (!a || !b) return;
  if (a.rating === b.rating && a.complaint === b.complaint) return;
  const claims = (await db.collection('dealClaims').where('storeId', '==', b.storeId).get()).docs.map(d => d.data() as any);
  const q = vendorQuality(claims); const st = db.doc('stores/' + b.storeId);
  await st.set({ dealRating: q.avg, dealRatings: q.ratings, complaints7d: q.complaints7d, ...(q.pause ? { dealsPaused: true, pauseReason: 'Auto-paused: ' + q.reason, pausedAt: new Date().toISOString() } : {}) }, { merge: true });
  if (q.pause) { const live = await db.collection('deals').where('storeId', '==', b.storeId).where('status', '==', 'live').get();
    const wb = db.batch(); live.docs.forEach(d => wb.update(d.ref, { status: 'removed', removedReason: 'Vendor auto-paused: ' + q.reason })); await wb.commit(); }
});

export const jobRating = onDocumentUpdated('jobs/{id}', async ev => {
  const a = ev.data?.before.data(), b = ev.data?.after.data(); if (!a || !b || !b.proId) return;
  const rated = !a.rating && b.rating, finished = a.status !== 'done' && b.status === 'done'; if (!rated && !finished) return;
  const jobs = (await db.collection('jobs').where('proId', '==', b.proId).get()).docs.map(d => d.data() as any);
  const r = jobs.filter(j => j.rating); const avg = r.length ? Math.round((r.reduce((s, j) => s + j.rating, 0) / r.length) * 10) / 10 : 0;
  await db.doc('pros/' + b.proId).set({ rating: avg, ratingCount: r.length, jobsDone: jobs.filter(j => j.status === 'done').length, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
});
