# TailorLink

TailorLink is a Next.js application for connecting customers with tailors, managing bookings, handling tailor availability, and tracking order progress.

## Stack

- Next.js App Router
- React 18
- TypeScript
- Prisma
- NextAuth
- Tailwind CSS
- Mapbox

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and provide values for:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_CALLBACK_TOKEN`
- `MPESA_CALLBACK_IP_ALLOWLIST`

For PostgreSQL staging or production preparation, see:

- [.env.postgres.example](/Users/jeremicarose/Documents/tailor-me/.env.postgres.example)

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
npm run studio
npm run db:validate:postgres
npm run db:generate:postgres
npm run db:migrate:postgres:dev
npm run db:migrate:postgres:deploy
npm run db:studio:postgres
```

## Notes

- The app uses SQLite locally through `prisma/dev.db`.
- PostgreSQL migration preparation is available via [prisma/schema.postgres.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.postgres.prisma).
- Migration guidance is documented in [docs/postgres-migration-plan.md](/Users/jeremicarose/Documents/tailor-me/docs/postgres-migration-plan.md).
- Staging execution steps are in [docs/postgres-staging-cutover-checklist.md](/Users/jeremicarose/Documents/tailor-me/docs/postgres-staging-cutover-checklist.md).
- Runtime cutover commands are in [docs/postgres-staging-cutover-execution.md](/Users/jeremicarose/Documents/tailor-me/docs/postgres-staging-cutover-execution.md).
- Staging deployment and smoke-test steps are in [docs/staging-deployment-checklist.md](/Users/jeremicarose/Documents/tailor-me/docs/staging-deployment-checklist.md).
- Readiness tracking is in [docs/postgres-production-readiness-matrix.md](/Users/jeremicarose/Documents/tailor-me/docs/postgres-production-readiness-matrix.md).
- A runtime health endpoint is available at `/api/health`.
- Production build depends on a working Next SWC binary and normal network access for dependency installation.
- For M-Pesa callbacks, `MPESA_CALLBACK_URL` should point to `/api/booking/payment/callback`.
- If `MPESA_CALLBACK_TOKEN` is set, it is automatically appended to the callback URL and verified on callback receipt.
- If `MPESA_CALLBACK_IP_ALLOWLIST` is set, callback requests must originate from one of the configured IPs.
- Current build is verified locally with `npm run lint`, `npm run typecheck`, and `npm run build`.
