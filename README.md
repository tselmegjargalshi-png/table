# TABLE.MN

Restaurant technology platform for Mongolia: QR digital menu, online ordering (dine-in, takeaway, delivery), kitchen display, table management with a floor plan, reservations, customer CRM, sales analytics, menu management, printable QR codes and a 7-step onboarding wizard. The whole interface is in Mongolian.

- **Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Prisma 6, PostgreSQL, Motion.
- **Auth:** email and password (bcrypt), signed JWT session cookie backed by a `Session` table, password reset tokens, role guards (owner, manager, waiter, cashier, kitchen). Every staff query is scoped to the restaurants the signed-in user belongs to.
- **Money:** stored as integer MNT. **Time zone:** Asia/Ulaanbaatar (UTC+8).

## Areas

| Area | Path |
| --- | --- |
| Marketing site | `/` |
| Customer menu and ordering | `/r/{slug}` (table QR: `/r/{slug}?t={code}`) |
| Order tracker | `/r/{slug}/order/{token}` |
| Staff app (dashboard, orders, tables, menu, reservations, customers, analytics, QR, settings) | `/app` |
| Kitchen display | `/kitchen` |
| Onboarding wizard | `/onboarding` |
| Customer account | `/account` |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` |

Live updates use short polling (orders 6s, kitchen 4s, tables 6s, dashboard 15s, order tracker 4s). There is no websocket dependency.

## Local setup

Requirements: Node.js 20+ and a PostgreSQL database.

```bash
cp .env.example .env          # then edit the values
npm install                   # also runs prisma generate
npm run db:migrate            # apply migrations (prisma migrate deploy)
npm run db:seed               # demo restaurant, 60 days of orders, demo accounts
npm run dev                   # http://localhost:3000
```

Local Postgres with Docker:

```bash
docker run --name tablemn-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tablemn -p 5432:5432 -d postgres:16
```

### Environment variables

See `.env.example` for the full list.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Pooled connection on hosted databases |
| `DIRECT_URL` | yes | Direct connection, used by migrations |
| `AUTH_SECRET` | yes | At least 32 characters. `openssl rand -base64 48` |
| `NEXT_PUBLIC_APP_URL` | yes in production | Public site URL, used in QR codes, sitemap and metadata |
| `NEXT_PUBLIC_MENU_BASE_URL` | no | Use `https://restaurant.table.mn` so QR codes point to `restaurant.table.mn/{slug}` |
| `CRON_SECRET` | yes in production | Bearer token for `/api/cron/demo-reset` (Vercel Cron sends it automatically) |
| `RESEND_API_KEY`, `MAIL_FROM` | no | Password reset emails. Without them the reset link is written to the server log |
| `AUTH_SHOW_RESET_LINK` | no | Shows the reset link on screen (demo environments only) |
| `QPAY_*` | no | Reserved for a future QPay provider |

## Demo data

`npm run db:seed` creates the fictional restaurant **ХОТЫН БУУЗ** (`/r/hotyn-buuz`) with about 60 days of orders, tables, reservations and customers. Demo restaurants (`isDemo`) also receive simulated live orders while someone is looking at them, and a daily cron resets them.

All demo accounts use the password `demo1234`:

| Email | Role |
| --- | --- |
| `demo@table.mn` | Owner |
| `manager@table.mn` | Manager |
| `waiter@table.mn` | Waiter |
| `kitchen@table.mn` | Kitchen |
| `customer@table.mn` | Customer |

Change or delete these accounts before using a database for real customers.

## Scripts

```bash
npm run dev          # development server
npm run build        # prisma generate && next build
npm run start        # production server
npm run lint
npm run typecheck
npm run db:migrate   # prisma migrate deploy
npm run db:migrate:dev
npm run db:seed
npm run db:reset     # drops and recreates the schema (destructive)
```

## Deploying

### Vercel + hosted Postgres (Neon, Supabase, Railway)

1. Create a Postgres database and copy the pooled and direct connection strings.
2. Import the repository in Vercel. `vercel.json` sets the cron and the `vercel-build` script runs `prisma generate && prisma migrate deploy && next build`.
3. Set `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` and `CRON_SECRET` for the Production environment.
4. After the first deploy, seed once from your machine with the production `DATABASE_URL`/`DIRECT_URL`: `npm run db:seed`.
5. For a `restaurant.table.mn` menu domain, add it to the project and set `NEXT_PUBLIC_MENU_BASE_URL`. `src/proxy.ts` rewrites `restaurant.*` hosts to `/r/*`.

### Any Node host

`npm run build && npm run start`, with the same environment variables and a reachable Postgres.

## Architecture notes

- `src/proxy.ts` (the Next.js 16 replacement for middleware) rewrites `restaurant.*` hosts and redirects unauthenticated visitors of `/app`, `/kitchen`, `/onboarding` and `/account` to `/login`. Real authorization is enforced again in server code (`src/lib/auth/guard.ts`).
- API routes live in `src/app/api`, return `{ ok, data }` or `{ ok: false, error, fields }` with Mongolian messages, and validate input with zod (`src/server/validation/schemas.ts`).
- Business logic lives in `src/server/services/*`. Orders, kitchen and tables share one status machine (`updateOrderStatus`).
- Payments go through the `PaymentProvider` interface in `src/server/payments`. The shipped providers record cash and card at the counter, and a demo online provider that marks the order paid. QPay or another gateway is added by implementing the same interface.
- Uploaded dish photos are resized with sharp and stored in the `Image` table, served from `/api/images/{id}`. Swap `src/server/services/images.ts` for S3 or Blob storage when volume grows.
- Rate limiting is in memory per server instance. Use a shared store (Redis, Upstash) if you run many instances.
- Charts are small custom SVG components, with no chart library. The floor plan and hero mockup use CSS 3D transforms only, and fall back to flat layouts for reduced motion and touch devices.

## Known limitations

- QPay and other online payment gateways are not implemented. Only the abstraction and the demo provider exist.
- Password reset emails need `RESEND_API_KEY`.
- Staff invitations are not implemented yet. The settings page lists existing staff only.
