# Reminder Runner Operations

## Purpose

The reminder runner sends:

- upcoming appointment reminders
- upcoming delivery date reminders

Current implementation:

- endpoint: `/api/admin/reminders/run`
- authorization:
  - admin session, or
  - `REMINDER_RUNNER_TOKEN`

## Environment Variable

Set in staging/production:

```env
REMINDER_RUNNER_TOKEN="generate-a-long-random-secret"
```

## Manual Admin Trigger

Admins can manually trigger the runner from:

- [src/app/dashboard/ClientManagement/page.tsx](/Users/jeremicarose/Documents/tailor-me/src/app/dashboard/ClientManagement/page.tsx)

## Dry Run

Dry run calculates what would be sent without sending emails:

```bash
curl -X POST "https://YOUR_DOMAIN/api/admin/reminders/run?token=YOUR_TOKEN&dryRun=true"
```

## Real Run

Actual send:

```bash
curl -X POST "https://YOUR_DOMAIN/api/admin/reminders/run?token=YOUR_TOKEN"
```

## Suggested Schedule

Recommended initial cadence:

- every hour

This is frequent enough for appointment reminders and still simple to operate.

## Suggested Scheduler Targets

- Vercel cron
- GitHub Actions scheduled workflow
- Render cron job
- Railway scheduled task
- any external scheduler capable of HTTP POST

## Response Shape

Example:

```json
{
  "success": true,
  "dryRun": false,
  "totalBookingsScanned": 18,
  "appointmentRemindersDue": 3,
  "appointmentRemindersSent": 3,
  "deliveryRemindersDue": 2,
  "deliveryRemindersSent": 2
}
```

## Operational Notes

- appointment reminders currently look ahead 24 hours
- delivery reminders currently look ahead 2 days
- repeat suppression window is 12 hours
- reminder timestamps are stored on `Booking`

## Failure Handling

If the runner returns non-200:

1. inspect deployment logs
2. confirm `REMINDER_RUNNER_TOKEN`
3. confirm email provider credentials
4. retry in dry-run mode first

## Current Limitation

This is not yet a full job system.

It is a staging-safe, cron-friendly execution path that can be promoted into a queue/worker model later if needed.
