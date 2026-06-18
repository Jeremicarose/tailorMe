# Staging Deployment Checklist

## Goal

Deploy TailorLink to a real staging environment backed by PostgreSQL and verify that the core platform works end to end.

## Required Environment Variables

Use [.env.postgres.example](/Users/jeremicarose/Documents/tailor-me/.env.postgres.example) as the source template.

At minimum, staging must define:

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

## Before Deploying

1. Confirm PostgreSQL schema is initialized.
2. Confirm runtime rehearsal succeeded locally.
3. Confirm callback URL points to the staging domain.
4. Confirm the generated default Prisma runtime client has been built from the PostgreSQL runtime schema during the deployment workflow.

## Suggested Staging Verification URLs

- `/api/health`
- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/map`
- `/dashboard/quickBooking`
- `/dashboard/profile`
- `/dashboard/verification`

## Staging Smoke Tests

### Infrastructure

- `GET /api/health` returns `200`
- the response shows `database: connected`

### Auth

- login works
- signup works
- protected routes redirect when unauthenticated

### Tailor Flows

- profile loads and saves
- verification submission works
- availability creation works
- appointments view loads

### Customer Flows

- map discovery loads
- verified-only filter works
- quick booking loads real tailors and slots
- direct booking prevents unverified tailor booking

### Payment Flows

- payment initiation works
- payment callback path is reachable
- initiated payments expire and release slots if abandoned

### Admin Flows

- payment overview loads
- tailor verification queue loads
- verify / reject actions work

## Staging Acceptance Criteria

Staging is considered usable when:

- core customer flow works
- core tailor flow works
- admin verification flow works
- `api/health` passes
- no critical runtime errors appear during smoke testing

## Rollback Trigger

Rollback staging if:

- `/api/health` fails
- auth breaks
- bookings fail
- payment state transitions fail
- verification review flow fails
