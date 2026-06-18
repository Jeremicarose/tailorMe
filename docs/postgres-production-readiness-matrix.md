# PostgreSQL Production Readiness Matrix

## Current State

| Area | Current Status | Notes |
|---|---|---|
| Local app runtime | Ready | Still uses SQLite safely |
| PostgreSQL schema | Ready for validation | Separate schema file exists |
| PostgreSQL env template | Ready | `.env.postgres.example` added |
| PostgreSQL migration commands | Ready | Added to `package.json` |
| Staging cutover checklist | Ready | Documented |
| Production cutover | Not started | Still intentionally deferred |
| Data migration tooling | Not implemented | Would depend on whether data must be preserved |

## Readiness Gates

### Gate 1: Technical Schema Readiness

- `db:validate:postgres` passes
- `db:generate:postgres` passes
- `db:migrate:postgres:dev` passes

### Gate 2: App Flow Readiness

- auth works on staging
- booking works on staging
- payment initiation works on staging
- payment callback works on staging
- admin trust/payment review works on staging

### Gate 3: Operational Readiness

- Postgres credentials are managed securely
- callback URLs are correct
- backups are configured
- rollback path is documented

### Gate 4: Production Decision

Only after the first three gates pass should the app be prepared for a runtime provider switch.
