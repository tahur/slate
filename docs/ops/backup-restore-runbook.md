# Backup and Restore Runbook

Date: February 13, 2026

## Purpose

This runbook defines the SQLite backup and restore drill process for Slate.

## Backup Policy

1. Keep daily backups of the database file.
2. Keep at least 14 daily restore points.
3. Store backups outside the runtime host volume.
4. Keep backup artifacts encrypted at rest.

## Restore Drill Frequency

1. Run restore drill at least once per week.
2. Run drill before major release cutovers.
3. Record drill outcome in release notes / ops log.

## Automated Drill Command

Run:

```bash
node scripts/verify-backup-restore.mjs
```

What it validates:
1. backup artifact creation
2. integrity check (`PRAGMA integrity_check`)
3. restored DB readability and data consistency

## Production Restore Procedure

1. Stop write traffic to the app.
2. Snapshot current DB files (`.db`, `.db-wal`, `.db-shm`).
3. Copy selected backup artifact to restore location.
4. Start app in maintenance mode.
5. Run integrity check and health endpoint verification:

```bash
sqlite3 /path/to/slate.db "PRAGMA integrity_check;"
curl -s http://localhost:3000/api/health
```

6. Resume traffic only after health is green.
7. Post-restore verification:
   - invoice list loads
   - payment posting works
   - report endpoints return expected period data

## Rollback

1. If restore verification fails, stop traffic again.
2. Re-attach the pre-restore snapshot.
3. Re-run health checks and critical flow smoke tests.
4. Escalate incident with logs and request IDs.
