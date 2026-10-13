## v0.3 — Phone OTP login, roles, maps + rider GPS, notifications
- **Phone OTP login** (Firebase Phone Auth) in the customer app, vendor app and web prototype/admin.
- **Roles** in `users/{uid}`: customer (default), vendor (per store), rider, admin. Only the admin can assign roles (Users & Access page); vendors/riders request access and wait for approval. Enforced by Firestore rules.
- **Maps** with Leaflet + OpenStreetMap: order tracking (store, home, live rider) and the admin zone map.
- **Rider GPS** sharing from the web rider view; customers see the rider move live.
- **Notifications**: local notifications on order status (customer) and new orders (vendor); browser notifications + in-app toasts on web.

Demo login: Firebase test numbers +1 650-555-0001 (customer, code 111111), 0002 (vendor, 222222), 0003 (pharmacy vendor, 333333), 0004 (rider, 444444).
