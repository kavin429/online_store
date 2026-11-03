# Driver app

Delivery rider app for the online store. Admins create riders from the admin
panel, the rider signs in here, and customers follow the delivery live from
their order page.

## Run

```bash
# from the repository root
pnpm install
pnpm prisma:generate
pnpm --filter @online-store/db migrate:deploy   # or: pnpm prisma:push
pnpm dev:driver
```

The app runs on **http://localhost:3003**. The root `.env` is loaded by
`next.config.js`; `DATABASE_URL` is read from `packages/db/.env` when it is not
set at the root. Set `DRIVER_APP_URL` if the app is deployed on a different
origin.

## How the flow works

1. **Admin → Drivers** (`/dashboard/drivers` in the admin app) → **Add Driver**.
   The API generates a unique username (for example `kasun4821`) and a random
   password. Both are shown once and can be copied or reset from the same page.
2. **Admin → Orders** → open an order → pick a driver and click **Assign**. The
   order becomes `ASSIGNED` and a tracking event is written.
3. The rider signs in here with the generated username/password and sees the
   assigned order.
4. The rider moves the order through:
   `ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED` (or reports `FAILED`).
   Every step writes a `TrackingEvent`.
5. While on a delivery the rider can press **Share live location**. The browser
   GPS position is posted every ~15 seconds to
   `/api/deliveries/:id/location` and stored on the order + driver.
6. The customer opens **My Orders → order** (`/account/orders/:id` in the store
   app) and sees the status timeline, rider details, and an embedded map that
   refreshes every 15 seconds.

## Driver features

- Username/password sign-in (NextAuth credentials, `DRIVER` role only)
- Active delivery list with customer contact, address, items and COD amount
- Call customer / open address in Google Maps
- Pickup, out-for-delivery, delivered and failed delivery actions with notes
- Live GPS sharing
- Delivery history
- Online/offline availability toggle, phone update and password change

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/deliveries?scope=history` | Assigned / completed orders |
| `GET` | `/api/deliveries/:id` | One assigned order + timeline |
| `PATCH` | `/api/deliveries/:id` | Update delivery status |
| `POST` | `/api/deliveries/:id/location` | Store rider GPS position |
| `GET/PATCH` | `/api/me` | Profile, availability, password |

## Database

The feature uses the `Driver`, `TrackingEvent` tables and the delivery columns
on `Order`. The migration lives at
`packages/db/prisma/migrations/20261102120000_add_drivers_delivery_tracking`.
