# Security Policy

Security issues in accounting software are high impact. Please report vulnerabilities responsibly.

## 1. Supported Branch

Security fixes are applied to:
1. `main` (active release branch)

## 2. How to Report a Vulnerability

Do not open public issues for unpatched vulnerabilities.

Instead:
1. contact maintainers privately through the project security contact channel
2. include reproduction steps, impact, and affected files/routes
3. include proof-of-concept only if necessary for validation

## 3. What to Include in a Report

1. vulnerability type (auth bypass, data leak, injection, invariant bypass, etc.)
2. exact route/API and request payload
3. prerequisites (user role, org state, data shape)
4. expected secure behavior vs actual behavior
5. severity assessment and business impact

## 4. Response Targets

1. initial acknowledgment: within 72 hours
2. triage decision: as soon as reproducible
3. fix timeline: based on severity

## 5. Severity Guidance

P0 examples:
1. accounting invariant bypass leading to data corruption
2. unauthenticated write access
3. cross-org data exposure

P1 examples:
1. sensitive error leakage
2. idempotency race allowing duplicate financial writes
3. authorization gaps on sensitive read paths

## 6. Disclosure

1. fixes are released before full public disclosure
2. release notes should include affected versions and mitigation steps
3. reporters are credited after fix, if they opt in

## 7. Hardening Expectations for Contributors

Security-related changes should include:
1. tests for exploit path and fixed path
2. guardrail updates if needed
3. no client stack trace leakage
4. explicit org isolation checks on data access paths

See:
1. `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
2. `docs/refactor/governance.md`
