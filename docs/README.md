# Slate Documentation Hub

Audience: maintainers, contributors, and LLM coding agents.

This index is the fastest way to understand how Slate works and how to contribute safely.

## Start Here

1. Project/FOSS contributor playbook:
   - `docs/FOSS_CONTRIBUTOR_PLAYBOOK.md`
2. Testing and safety guardrails:
   - `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
3. Health, observability, and ops:
   - `docs/HEALTH_AND_OPERATIONS.md`
4. Revamp implementation summary (Phases 0-9):
   - `docs/REVAMP_IMPLEMENTATION_SUMMARY.md`

## Community Docs (Root)

1. Contribution workflow:
   - `CONTRIBUTING.md`
2. Security policy:
   - `SECURITY.md`
3. Community behavior policy:
   - `CODE_OF_CONDUCT.md`

## What Was Added

Recent contributor-onboarding documentation additions:
1. `docs/FOSS_CONTRIBUTOR_PLAYBOOK.md`
2. `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
3. `docs/HEALTH_AND_OPERATIONS.md`
4. `docs/REVAMP_IMPLEMENTATION_SUMMARY.md`
5. `CONTRIBUTING.md`
6. `SECURITY.md`
7. `CODE_OF_CONDUCT.md`

## Core Technical References

1. Architecture:
   - `docs/ARCHITECTURE.md`
2. Accounting invariants (must not break):
   - `docs/ACCOUNTING_INVARIANTS.md`
3. UI style guide:
   - `docs/STYLE_GUIDE.md`
4. Product roadmap:
   - `docs/ROADMAP.md`

## Refactor Governance and Phase Records

1. Program governance:
   - `docs/refactor/governance.md`
2. ADR (modular monolith decision):
   - `docs/adr/0001-modular-monolith.md`
3. Phase documents:
   - `docs/refactor/phase2-tax-engine.md`
   - `docs/refactor/phase3-domain-extraction.md`
   - `docs/refactor/phase4-transaction-model.md`
   - `docs/refactor/phase5-data-access.md`
   - `docs/refactor/phase6-error-model.md`
   - `docs/refactor/phase7-test-architecture.md`
   - `docs/refactor/phase8-observability-ops.md`
   - `docs/refactor/phase9-performance-scale.md`

## Ops Runbooks

1. Backup and restore:
   - `docs/ops/backup-restore-runbook.md`

## Quick Commands

```bash
npm run ci
npm run ci:guardrails
npm run check:phase8
npm run check:phase9
curl -s http://localhost:5173/api/health
```
