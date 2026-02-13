# Health and Operations Guide

Version: 1.0
Date: February 13, 2026

This guide covers runtime health checks, observability, and operational drills.

## 1. Health Endpoint

Endpoint:
1. `GET /api/health`

Current behavior:
1. returns `200` when healthy
2. returns `503` when degraded
3. includes:
   - DB ping status + latency
   - startup check snapshot
   - report cache stats
4. sets `cache-control: no-store`
5. propagates `x-request-id` when available

Quick check:

```bash
curl -s http://localhost:5173/api/health
```

## 2. Startup Checks

Startup checks run from `src/lib/server/db/index.ts` and validate:
1. SQLite journal mode is WAL
2. foreign key enforcement is ON
3. `PRAGMA quick_check` returns `ok`
4. DB ping query succeeds

If any check fails, startup throws and service should not continue.

## 3. Structured Logging and Correlation IDs

Observability primitives:
1. `src/lib/server/platform/observability/context.ts`
2. `src/lib/server/platform/observability/logger.ts`

Request lifecycle behavior in `src/hooks.server.ts`:
1. generates `requestId`
2. writes `request_started` log
3. writes `request_completed` log (status + duration)
4. writes `request_failed` log on unhandled errors
5. exposes `x-request-id` response header

## 4. Domain Event Logging

Domain transition events are emitted in critical accounting flows:
1. ledger posting/reversal events
2. invoicing state transition events
3. receivables settlement/payment/credit events
4. audit activity logging events

Use these events for incident diagnostics and flow traceability.

## 5. Report Cache Operations

Report cache is in-memory and scoped per process.

Implementation:
1. `src/lib/server/platform/observability/report-cache.ts`
2. used by GST reporting module

Invalidation is triggered on write flows that affect reporting:
1. invoice issue/cancel
2. credit note creation
3. expense creation

## 6. Backup and Restore

Primary runbook:
1. `docs/ops/backup-restore-runbook.md`

Automated restore drill:

```bash
node scripts/verify-backup-restore.mjs
```

This drill verifies:
1. backup artifact creation
2. integrity check success
3. restored DB read consistency

## 7. Operational Incident Checklist

When investigating a production issue:
1. collect `x-request-id` from failing response
2. search structured logs for that request ID
3. call `/api/health` and capture snapshot
4. run integrity checks if data consistency is suspected
5. run restore drill if backup validity is in question

## 8. Phase 8/9 Operational Guards

Run:

```bash
npm run check:phase8
npm run check:phase9
```

These checks enforce:
1. observability and ops contracts
2. backup/restore drill validity
3. performance/query-plan guardrails
