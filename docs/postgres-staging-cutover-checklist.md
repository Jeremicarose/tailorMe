# PostgreSQL Staging Cutover Checklist

## Objective

Move TailorLink from SQLite-backed local development assumptions toward a staging deployment backed by PostgreSQL, without changing the live runtime provider in the application code yet.

## Inputs Required

- A reachable PostgreSQL database
- A `DATABASE_URL` that starts with `postgresql://` or `postgres://`
- A staging environment with all required app secrets
- A temporary or final staging domain

## Files Involved

- [prisma/schema.postgres.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.postgres.prisma)
- [.env.postgres.example](/Users/jeremicarose/Documents/tailor-me/.env.postgres.example)
- [package.json](/Users/jeremicarose/Documents/tailor-me/package.json)
- [docs/postgres-migration-plan.md](/Users/jeremicarose/Documents/tailor-me/docs/postgres-migration-plan.md)

## Phase 1: Environment Preparation

1. Copy `.env.postgres.example` into your staging secret store or a secure local file.
2. Set a real `DATABASE_URL`.
3. Set `NEXTAUTH_URL` to the staging domain.
4. Set M-Pesa callback values to a staging-safe callback URL.

## Phase 2: Schema Validation

Run:

```bash
npm run db:validate:postgres
npm run db:generate:postgres
```

Success criteria:

- Prisma validates the PostgreSQL schema
- PostgreSQL client generation completes

## Phase 3: Migration Bootstrap

Run:

```bash
npm run db:migrate:postgres:dev
```

Success criteria:

- initial PostgreSQL migration history is created
- no provider-specific validation errors occur

## Phase 4: Staging Runtime Verification

Deploy the app to staging with the PostgreSQL environment values.

Validate these flows:

- authentication
- tailor profile creation and updates
- discovery/map listing retrieval
- quick booking
- direct tailor booking
- payment initiation
- payment callback handling
- stale payment expiry
- admin payment overview
- tailor verification submission
- admin tailor verification review

## Phase 5: Data Sanity Review

Verify manually:

- enums are stored correctly
- measurement JSON persists and reads correctly
- availability booking transitions behave correctly
- payment state fields persist correctly
- verification metadata persists correctly

## Phase 6: Rollback Readiness

Before any production switch:

- keep SQLite local development untouched
- keep PostgreSQL deployment isolated to staging
- document how to revert staging `DATABASE_URL`
- keep schema files versioned side by side

## Production Cutover Exit Criteria

Do not cut production until:

- staging checks pass end-to-end
- migration scripts are repeatable
- callback URLs are verified
- admin verification and payment views are working
- rollback steps are documented and tested

## Non-Goals of This Phase

- switching the active runtime schema from SQLite to PostgreSQL in app code
- importing real historical production business data
- changing the local developer workflow to require PostgreSQL
