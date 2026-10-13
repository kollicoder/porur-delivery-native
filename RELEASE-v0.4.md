## v0.4 — Launch fixes
Includes the checkout **location pin + "use my current location"** work (previously only on `firebase-sync`).

- **Pricing, clear per order.** A cart from several stores becomes one order per store, and the delivery fee is charged **once per checkout** (on part 1). Every order now shows each item's price, the item total, the delivery fee and "Part n of m". The checkout explains the split. (The reported "₹411 for ~₹200" medicine order was 5 items = ₹386 + ₹25 fee; the screen showed only quantities, so it looked wrong.)
- **Delivery OTP is private.** The OTP is no longer on the order. It sits in `orderSecrets/{id}`, which only the customer and admin can read. The rider types the code and the **Firestore rules check it** before an order can become *Delivered*. The demo OTP hint is gone.
- **Auto-dispatch.** When a store accepts, the nearest online rider with a fresh GPS fix is assigned. If none has one, the least-busy online rider is used. Errands are assigned at booking. The admin can still reassign, and orders with no free rider show as *Unassigned*.
- **Pay on delivery.** Cash or UPI at the door. The rider records how it was paid, and online payment is marked *Coming soon*. There is no fake UPI.
- **Push notifications.** Expo push tokens are registered per user, store and rider. Status changes send an Expo push from the app; in-app toasts and local notifications stay. Background push on the Android build only starts once an EAS project and FCM are configured (see README).
- **Prescriptions are private.** Photos moved off the order into `prescriptions/{id}` (customer, that pharmacy and admin only, never riders), capped at about 300 KB.

Demo logins (Firebase test numbers): +1 650-555-0001 / 111111 customer, 0002 / 222222 vendor, 0004 / 444444 rider.
