# ADR 0001: Modular Monolith for Slate Refactor

Date: February 13, 2026  
Status: Accepted

## Context

Slate is a single-process SvelteKit application on SQLite with accounting-critical workflows.

Current pain points:
1. Business logic scattered across route handlers.
2. Safety fixes need stronger consistency and guardrails.
3. Team velocity is affected by coupling and duplicate logic.

## Decision

Adopt a **modular monolith** architecture now, not microservices.

Key boundaries:
1. `routes`: transport/auth/input mapping only.
2. `application`: use-case orchestration and transaction boundaries.
3. `domain`: invariants and business rules.
4. `infrastructure`: persistence and integrations.

## Consequences

Positive:
1. Preserves transactional simplicity for accounting operations.
2. Reduces coordination overhead while creating clear ownership boundaries.
3. Enables faster hardening and refactor delivery.

Negative:
1. Requires disciplined module boundaries to avoid regressing to route-centric logic.
2. Some future scaling concerns remain centralized until extraction triggers are reached.

## Microservice Triggers (Future)

Re-evaluate extraction only when at least two are true:
1. Multiple teams need independent service ownership.
2. Background/reporting workloads require independent scaling.
3. Database throughput/lock contention is a proven bottleneck.
4. Release cadence is blocked by monolith coupling.

## Implementation Notes

This ADR is enforced by:
1. CI gates (`check`, `build`, money guardrail, phase1 regression guardrail).
2. Refactor governance docs under `docs/refactor/`.
3. Phase plan in `revamp.md`.
