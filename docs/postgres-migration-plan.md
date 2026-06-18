# PostgreSQL Migration Plan

## Goal

Prepare TailorLink for production on PostgreSQL without breaking the current SQLite-based local workflow.

## Current State

- Local development schema: [prisma/schema.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.prisma)
- Current datasource provider: `sqlite`
- Local database file: `prisma/dev.db`
- Runtime client: [src/lib/prisma.ts](/Users/jeremicarose/Documents/tailor-me/src/lib/prisma.ts)

## Safe Preparation Added

- Separate PostgreSQL schema: [prisma/schema.postgres.prisma](/Users/jeremicarose/Documents/tailor-me/prisma/schema.postgres.prisma)
- Postgres-specific Prisma scripts in [package.json](/Users/jeremicarose/Documents/tailor-me/package.json)
- `.env.example` now defaults to local SQLite while documenting the production PostgreSQL form

## Why This Approach

Switching the active Prisma provider immediately would force every local developer and every runtime environment to have PostgreSQL available now.

This safe-prep approach gives us:

- continued local stability
- production migration readiness
- a separate validation path for PostgreSQL
- a lower-risk cutover strategy

## Prepared Commands

Validate the PostgreSQL schema:

```bash
npm run db:validate:postgres
```

Generate a PostgreSQL-targeted Prisma client into `prisma/generated/postgres-client`:

```bash
npm run db:generate:postgres
```

Create PostgreSQL migrations during migration work:

```bash
npm run db:migrate:postgres:dev
```

Deploy PostgreSQL migrations in staging/production:

```bash
npm run db:migrate:postgres:deploy
```

Open Prisma Studio against PostgreSQL:

```bash
npm run db:studio:postgres
```

## Production Cutover Plan

1. Provision a PostgreSQL database for staging.
2. Copy the production connection string into `DATABASE_URL`.
3. Run:

```bash
npm run db:validate:postgres
npm run db:generate:postgres
npm run db:migrate:postgres:dev
```

4. Verify the generated PostgreSQL schema and migration history.
5. Create a staging deployment that points to PostgreSQL.
6. Validate all core flows:
   - auth
   - tailor profile management
   - discovery
   - booking creation
   - payment state changes
   - admin verification
7. Only after staging validation, switch the primary runtime schema/provider.

## Data Migration Considerations

The application currently stores local/dev data in SQLite. A full cutover will require:

- exporting critical reference data from SQLite
- importing it into PostgreSQL
- checking enum/value compatibility
- validating date/time handling
- validating JSON fields such as measurements and unavailable dates

For real production, the migration should treat SQLite as development data only unless business-critical records already exist there.

## Risks

### Technical

- schema drift between the SQLite and PostgreSQL schema files
- JSON behavior differences across providers
- date/time behavior differences
- migration ordering issues

### Operational

- developers accidentally generating the wrong Prisma client
- staging/production envs using the wrong `DATABASE_URL`

## Recommendation

Do not flip the live schema provider until:

- the PostgreSQL schema is validated
- staging runs successfully on PostgreSQL
- a migration checklist has been executed end-to-end

This repo is now prepared for that next step without breaking the current working local setup.
