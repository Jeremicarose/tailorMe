# PostgreSQL Staging Cutover Execution Runbook

Date: 2026-06-06

## Purpose

This runbook is the practical execution layer for moving TailorLink from SQLite-based local assumptions to a staging deployment that runs on PostgreSQL.

This is tailored to the current repository layout and scripts in:

- [/Users/jeremicarose/Documents/tailor-me](/Users/jeremicarose/Documents/tailor-me)
- [package.json](/Users/jeremicarose/Documents/tailor-me/package.json)
- [prisma/schema.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.prisma)
- [prisma/schema.postgres.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.postgres.prisma)

## Important Reality

The repo currently supports PostgreSQL in a **safe preparation mode**.

That means:

- the application still runs locally on SQLite
- PostgreSQL validation commands are available
- a real staging runtime cutover still requires generating the **default** Prisma client from a PostgreSQL-backed schema

So there are two phases:

1. `Validation phase`
2. `Runtime cutover phase`

---

## Preconditions

Before doing anything:

1. Work from a dedicated branch or release snapshot.
2. Do not use your normal SQLite `.env` as the source of truth for this cutover.
3. Have a real PostgreSQL connection string ready.
4. Have staging secrets for:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
   - `RESEND_API_KEY`
   - `MPESA_*`

---

## Phase 1: No-Risk PostgreSQL Validation

This phase does **not** change the active app runtime schema.

### Step 1

From the repo root:

```bash
cd /Users/jeremicarose/Documents/tailor-me
```

### Step 2

Use a real Postgres URL inline for validation:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run db:validate:postgres
```

Expected result:

- Prisma validates `prisma/schema.postgres.prisma`

### Step 3

Generate the PostgreSQL client artifact:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run db:generate:postgres
```

Expected result:

- client is generated into `prisma/generated/postgres-client`

### Step 4

Create or update PostgreSQL migrations:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run db:migrate:postgres:dev
```

Expected result:

- migrations apply cleanly against PostgreSQL

If this phase fails, stop here. Do **not** attempt runtime cutover.

---

## Phase 2: Runtime Cutover Rehearsal for Staging

This is the real staging-grade step.

### Why this is necessary

The app imports Prisma from `@prisma/client` in runtime code:

- [src/lib/prisma.ts](/Users/jeremicarose/Documents/tailor-me/src/lib/prisma.ts)

That client is generated from the active default schema:

- [prisma/schema.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.prisma)

So for a real staging runtime, the default schema must temporarily become PostgreSQL-backed during the cutover build.

### Safe execution approach

Do this only in:

- a clean branch
- or a staging build workspace
- or a deployment pipeline step

### Step 1: Back up the current default schema

```bash
cp prisma/schema.prisma /tmp/tailor-me-schema.sqlite.backup.prisma
```

### Step 2: Generate the default runtime Prisma client for PostgreSQL

Use the dedicated runtime schema:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run db:generate:postgres:runtime
```

### Step 3: Apply PostgreSQL migrations

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npx prisma migrate deploy
```

### Step 4: Run repo validation against the PostgreSQL-backed runtime setup

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run typecheck
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run lint
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" npm run build
```

Expected result:

- all three commands pass

### Step 5: Launch a staging runtime locally if needed

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public" \
NEXTAUTH_URL="http://127.0.0.1:3000" \
npm run dev -- --hostname 127.0.0.1 --port 3000
```

---

## Staging Smoke Test Checklist

After runtime cutover, validate these paths:

### Authentication

- `/login`
- `/signup`
- protected dashboard routes

### Tailor workflow

- `/dashboard/profile`
- `/dashboard/tailor/availability`
- `/dashboard/appointments`
- `/dashboard/order`

### Customer workflow

- `/dashboard/map`
- `/dashboard/quickBooking`
- `/tailors/[tailorId]`

### Admin workflow

- `/dashboard/ClientManagement`
- `/dashboard/verification`

### Payment workflow

- booking creation
- payment initiation
- callback confirmation
- stale initiated payment expiry

### Trust workflow

- tailor verification submission
- admin approval/rejection
- verified-only discovery filtering

---

## Rollback Steps

If the runtime cutover rehearsal fails:

### Step 1

Regenerate the default Prisma client back against SQLite:

```bash
npx prisma generate
```

### Step 2

Re-run baseline validation:

```bash
npm run typecheck
npm run lint
npm run build
```

### Step 3

Discard the failed staging artifact or branch.

---

## Production Readiness Gate

Do not promote Postgres runtime cutover beyond staging until all of these are true:

- PostgreSQL migrations apply cleanly
- build passes with PostgreSQL as the active runtime provider
- auth works
- bookings work
- payment callback works
- stale payment expiry works
- admin verification works
- rollback steps are proven

---

## Recommended Next Action

The next real execution step is:

1. create a real staging PostgreSQL database
2. run the `Phase 1` validation commands
3. perform the `Phase 2` runtime cutover on a clean staging branch or deployment workspace

This is the first point where the application will truly be running on PostgreSQL rather than just being prepared for it.
