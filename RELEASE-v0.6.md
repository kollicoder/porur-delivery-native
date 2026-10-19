# v0.6 — New models: Group-buy Meter · Office lunch · Home services · Surplus flash deals

All four models ship in the customer app, the partner app (vendor / home cook / service pro), the web prototype (customer, rider, partner, desktop admin) and on the live backend (`study-vignes`).
The v0.5 grocery flows are unchanged: v0.5 rules checks still pass 57/57, and food items only appear as flash deals.
Customers find the new models under **"More ways to save"** on Home.

Web app: https://kollicoder.github.io/porur-delivery-prototype/ (add `?test=1` to use the test numbers)

## What's new
### 🧺 Group-buy "Meter" (weekly)
- A weekly list of 32 SKUs for the porur-west cluster and a ₹300 minimum basket.
- Two prices per item: the Sunday price (the maximum you pay) and a lower price if the meter fills (100 baskets).
- Shows a live progress bar, a countdown to Saturday 9 pm and the expected delivery date.
- Customers pay cash or UPI on delivery and are never charged more than the Sunday price.
- Share/join link (WhatsApp) that opens straight to the customer's community.
- **Leader role** (appointed by admin): sees the community's baskets, holds the private gate-drop code, marks each hand-over (cash, UPI or missed) and earns 5% of delivered sales, tracked per batch and all-time.
- **Admin:**
  - per-SKU aggregation and supplier PO CSV (rounded to cases)
  - close the batch at the fill price or the Sunday price; this re-prices every basket server-side, creates gate drops per community and opens the next meter
  - wallet credits
- **Rider:** gate-drop task. The rider must enter the leader's code, and the rules check it.

### 🍱 Office lunch
- Home cooks onboard with a 14-digit FSSAI number, FSSAI expiry and a hygiene checklist, then wait for admin approval.
- Cooks publish the next day's veg and non-veg menu, priced ₹130–150 (enforced).
- Teams order at least 5 packs, with a veg/non-veg split and company/office/floor details. Cutoff is 8 pm the evening before; the slot is 12:15–12:45.
- Cooks see the next day's orders grouped by office.
- Admin creates one batched rider run per office. Reception holds the drop code.

### 🛠️ Home services
- **Pro role** for plumbers, electricians, appliance repair and deep cleaning (no maids).
- KYC stores only the last 4 digits of the ID plus a police-verification reference. Admin marks the pro police-verified and approves them.
- Customers book a 2-hour slot with a ₹149 inspection fee. The job is auto-assigned to a verified pro with that skill.
- A start OTP and a finish OTP are checked by the rules.
- The pro sends a quote; the customer approves or declines it. The customer then rates the job.
- **30-day warranty:** a free re-visit by the same pro.
- Admin jobs board with manual assignment.

### 🔥 Surplus flash deals
- Admin-approved FSSAI kitchens post deals by voice (Tamil or English, parsed on the device) or by form, then confirm on a review screen.
- Rules enforced in the client and in Firestore rules:
  - price at most 0.7× the catalogue price
  - expiry 60–90 minutes
  - at most 2 deals and 20 units per vendor per night
- Claims are atomic and first-come. Each claim gets a private pickup code (the default); batched ₹39 delivery is optional.
- **Opt-in alerts:** within 3 km, at most 1 a day, none after 10:30 pm. They are sent by the `dealFanout` Cloud Function (Expo push) plus an in-app alert.
- Ratings and complaints. The `dealQuality` Cloud Function auto-pauses a vendor whose rating drops below 4 or who gets 2 complaints in 7 days.
- **Admin:** kill switch (removes every live deal), vendor approve/pause, batched delivery runs.

## Test numbers (Firebase test phones on study-vignes — no SMS is sent)
| Role | Number | OTP |
|---|---|---|
| Customer | +91 90000 00001 | 111111 |
| Grocery vendor (s1) | +91 90000 00002 | 222222 |
| Pharmacy (no role yet — shows "pending approval") | +91 90000 00003 | 333333 |
| Rider (web app) | +91 90000 00004 | 444444 |
| Food kitchen (s4, flash deals) | +91 90000 00005 | 555555 |
| Home cook | +91 90000 00006 | 666666 |
| Service pro | +91 90000 00007 | 777777 |
| Community leader (c1) | +91 90000 00008 | 888888 |
| Second customer | +91 90000 00009 | 999999 |

Demo hints and admin approval need the bootstrap admin (not published). The test admin was used only during the live E2E and has been removed from the live rules.

## Tests
- Firestore rules: v0.5 57/57 and v0.6 113/113 on the emulator.
- Web + native-web E2E: 56/56 on the emulator and **58/58 live** on study-vignes. The live run includes Cloud Function auto-pause and the push fan-out log.

## Cost
- 3 Cloud Functions (us-central1, where the nam5 Firestore lives) with max 1 instance, 256 MiB and no minimum instances. Idle cost is ₹0 and expected usage stays in the free tier.
- The ₹1000/month budget kill-switch is still active.

## Install (Android)
Download `porur-customer.apk` and `porur-vendor.apk` (arm64) below. Voice input needs the Google app on the phone.

## iPhone (Expo Go)
Both apps are published with EAS Update to the `preview` channel under the Expo account **cv4591**, so they open in Expo Go (SDK 57, App Store) at any time; the box does not need to be running.
1. Install Expo Go from the App Store and sign in as cv4591 (avatar, top right).
2. Open the project from the Projects list under the account, or scan a link with the Camera:
   - Customer: `exp://u.expo.dev/99bb3ec0-0382-4864-97cb-2d05d52d6f6d?channel-name=preview`
   - Partner: `exp://u.expo.dev/144b9794-b5a6-4f5b-bc87-28bb26827b3d?channel-name=preview`

Voice input is not available in Expo Go, so it falls back to typing. A real App Store or TestFlight build needs an Apple Developer Program membership (US$99 a year) and EAS Build.

## Push notifications
The apps now register Expo push tokens using the EAS project IDs, and the Android builds include `google-services.json` for the Firebase Android apps on study-vignes. Android push delivery also needs the FCM V1 service-account key uploaded to each Expo project (expo.dev, then Credentials).
