---
name: access-control-safety-testing
description: Use when writing tests for role-based access control gates or permission-based linting. Ensures test fixtures comprehensively cover all 11 membership check pattern variations.
---

## The Problem

When building a test fixture for an access control gate (linting rule, permission validator, etc.), a common mistake is to test only the obvious pattern — `.includes()` — and miss the other 10 variations. Those patterns will silently bypass the gate, creating a false sense of security.

## The 11 Membership Check Patterns

Your test fixture must cover **all** of these:

1. `.includes()` — `principal.roles.includes(ROLES.admin)`
2. `.some()` — `principal.roles.some(r => ...)`
3. `.every()` — `principal.roles.every(r => ...)`
4. `.find()` — `principal.roles.find(r => ...)`
5. `.findIndex()` — `principal.roles.findIndex(...) !== -1`
6. `.indexOf()` — `principal.roles.indexOf(...) !== -1`
7. `.filter()` — `principal.roles.filter(...).length > 0`
8. `.at()` — `principal.roles.at(0) === ROLES.admin`
9. Bare indexing — `principal.roles[0] === ROLES.admin`
10. Set wrapping — `new Set(principal.roles).has(ROLES.admin)`
11. Hardcoded strings — `principal.roles[0] === 'admin'`

## Test Fixture Requirements

When writing the fixture:

- **Test all 11** patterns in a single cohesive test or set of test cases
- **Document the list** in a comment so future maintainers know what's covered
- **Verify severity** — ensure the rule is `error`, not `warn`. A severity downgrade to `warn` silently breaks the gate while tests pass green.
- **Run through your linter** (dependency-cruiser, ESLint, etc.) to confirm all patterns are rejected

If your fixture catches only `.includes()`, you have a **security gap**. The other 10 patterns will pass CI while you believe they're blocked.

## Why Completeness Matters

Role-based access control gates prevent unauthorized users from accessing features. A gate with a gap is worse than no gate — it creates false confidence. Comprehensive testing ensures:

- Every variation of membership checking is caught
- Future maintainers cannot accidentally weaken the gate
- CI enforces the gate consistently across all patterns
- Authorization failures are deterministic, not pattern-dependent
