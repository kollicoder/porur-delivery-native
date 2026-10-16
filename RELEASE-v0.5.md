# v0.5 — New UI ("ding-dong" design)

Frontend-only release. The Firestore data model, security rules, auth and backend logic are unchanged from v0.4: split-cart single delivery fee, private delivery OTP checked by rules, auto rider dispatch, cash/UPI on delivery, private prescriptions.

**Brand name not final.** The design placeholder is `ding-dong`. It lives in one constant: `packages/shared/src/brand.ts` for native and `src/brand.js` for web. You can override it at build time with `EXPO_PUBLIC_BRAND_NAME` / `VITE_BRAND_NAME`. The app-store name in `app.json` still reads "Porur Delivery".

## What changed
- **New design system** (`packages/shared/src/ui/kit.tsx`):
  - cream canvas, ink text, yellow primary, pastel category tiles
  - Bricolage Grotesque, Plus Jakarta Sans and Noto Sans Tamil fonts
  - dark pill tab bar with a text label on every icon
- **Customer screens:** login, home, category grid, search, voice, cart (grouped by store), checkout, tracking, orders, book a rider, plus a new **Profile & settings** screen with an English/தமிழ் language switch and an **About & credits** screen (photo credits are moved out of the main flow).
- **Seller screens:** partner login and access request, orders (accept timer, big Reject/Accept), items (48dp "Edit price"), Rx review checklist, sales.
- **Web prototype:** customer, rider, mobile admin and desktop admin re-skinned.
- **Desktop admin:** larger type, AA contrast, and a separate **Breakeven** card.

## Review fixes
- **Locked buttons:**
  - A locked "Place order" shows a prominent reason. Tapping the reason or the button scrolls to the prescription section and highlights it.
  - A locked vendor "Accept" links to Rx review.
- **Contrast:** WCAG AA for disabled buttons (#57554D on #E9E4D8, 6.3:1), dark text on orange, and Tamil subtext in #33302A/#57554D.
- **New states:**
  - loading skeletons and offline banner
  - network error with retry
  - OTP wrong, expired and too many tries, with a 30-second resend timer
  - store rejected and order cancelled (prescription rejected)
  - out of stock in cart, with a Remove action
  - empty states
- **Demo text:** demo and OTP hints and "Simulate" buttons appear only in dev, the emulator, or with `?test=1`.
- **Tap targets** of 48dp or more for steppers, Change, Track/Call and remove ✕.
- **Home:** all four category tiles sit above the fold on a 360×640 screen, with nothing clipped.
- **Rider web view:**
  - a red banner when you're on duty with location off
  - a clear offline state
  - numbered steps: collect payment, then enter the customer's 4-digit code
  - items collapsed to reduce crowding

## Demo logins (Firebase test numbers)
- **Customer:** +91 90000 00001, code 111111 (was +1 650-555-0001 before 16 Oct 2026)
- **Vendor s1:** 0002, code 222222
- **Pharmacy:** 0003, code 333333 (needs approval)
- **Rider Karthik:** 0004, code 444444
