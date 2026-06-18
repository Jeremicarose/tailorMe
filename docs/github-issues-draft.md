# GitHub Issues Draft

## P0

### 1. Replace quick booking mocks with live tailor and availability data
- Problem: [src/app/dashboard/quickBooking/page.tsx](/Users/jeremicarose/Documents/tailor-me/src/app/dashboard/quickBooking/page.tsx) still uses hard-coded tailors and slots.
- Goal: Load real tailor options and slot options from backend APIs.
- Acceptance criteria:
  - Tailor dropdown loads from live API data
  - Availability dropdown updates based on selected tailor
  - Booking submission uses real `tailorId` and `availabilityId`
  - Loading, empty, and error states are shown clearly

### 2. Harden booking lifecycle and payment state transitions
- Problem: booking creation, payment initiation, and slot locking still need stronger transactional guarantees.
- Goal: prevent double-booking and inconsistent status transitions.
- Acceptance criteria:
  - slot reservation and booking creation remain atomic
  - invalid state transitions are blocked
  - payment completion path is explicit and traceable

### 3. Move production database from SQLite to Postgres
- Problem: SQLite is fine locally but not appropriate for production concurrency and operations.
- Goal: adopt Postgres for production deployment.
- Acceptance criteria:
  - schema and client work against Postgres
  - migration plan is documented
  - environment config is production-ready

### 4. Add tailor verification and listing trust signals
- Problem: discovery without trust indicators will limit conversion.
- Goal: support tailor verification and storefront credibility.
- Acceptance criteria:
  - verification status added to schema and profile APIs
  - discovery/detail pages expose verification state
  - admin workflow for verification is defined

### 5. Add observability and error tracking
- Problem: operational debugging still relies too much on console output.
- Goal: production-grade monitoring and structured logs.
- Acceptance criteria:
  - structured server logging
  - external error tracking integrated
  - critical booking/auth/payment failures are visible

## P1

### 6. Add appointment and delivery reminders
### 7. Add garment-specific measurement templates
### 8. Improve order timeline and customer status visibility
### 9. Add search and filtering improvements for tailor discovery
### 10. Add tailor business insights dashboard

## P2

### 11. Add institutional/repeat-order workflows
### 12. Add tailor subscription and featured listing monetization
### 13. Add messaging integrations like WhatsApp/SMS
### 14. Add AI assistance for intake, summaries, and pricing suggestions
