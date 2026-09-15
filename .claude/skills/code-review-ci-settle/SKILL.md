---
name: code-review-ci-settle
description: After addressing PR review feedback and pushing fixes, wait for CI to fully settle before acting on CodeRabbit's re-triggered review.
---

## Pattern: Wait for All Checks Before Interpreting the Verdict

When CodeRabbit flags `CHANGES_REQUESTED` and you've addressed the threads and pushed new commits:

### 1. Push and Then **Wait**

```
[Push fixes to e.g. e51bca90]
       ↓
[pending: 15+ checks, lighthouse-mobile=pending, ...]
       ↓
Wait for all to land
       ↓
[pending: 0, lighthouse-mobile=pass, all gates green]
```

**Do not** immediately request a re-trigger or read fresh CR feedback. Slow suites take 10–30 minutes:

- Mutation testing shards (4-way parallel, each ~5–10 min)
- Lighthouse (desktop + mobile, ~2–5 min each)
- E2E visual tests (if gating)

A "pending" check is not a failure—it's still running. Confusing the two leads to premature re-triggers.

### 2. Use CodeRabbit's Rate-Limit Window as a Natural Checkpoint

When CR says **"rate limited available in N minutes"**, use that window to wait for CI:

```
CodeRabbit re-trigger ready at 16:38 UTC (30-min limit)
       ↓
Meanwhile, wait for [pending: 0]
       ↓
At 16:38, CI is green + CR is ready → both aligned
       ↓
Request @coderabbitai review
```

**Why this works:** The 30-minute rate limit is long enough for all suites to complete. By the time you can re-trigger, CI is settled.

### 3. Re-Trigger Only After All Checks Pass

Sequence:

1. Push your fixes.
2. Confirm `pending: 0` and all gates green (check the "43/58 pass" or equivalent summary).
3. If CodeRabbit is rate-limited, wait until the window opens.
4. Request `@coderabbitai review` in a PR comment.
5. **Then** read the new verdict on the full, green CI state.

### 4. If CI Fails, Fix It First

Do not request a re-trigger if CI is red. The failure is the real feedback:

- Mutation gate failure → assertions are missing
- Lighthouse gate failure → bundle is bloated
- E2E failure → the flow is broken

Fix the root cause and push again. CR feedback from a red run is stale.

## Example from PR #275

```
15:50 — CodeRabbit: CHANGES_REQUESTED (unresolved=0 after fixes)
        Commit e51bca90 pushed

pending=15, lighthouse-mobile=pending
        ↓ [wait ~12 min]
        ↓
pending=0, lighthouse-mobile=pass
58 pass, 4 skipping, 0 failures

16:38 — CodeRabbit available (rate-limit window opens)
        Request @coderabbitai review

        [New verdict reflects green CI state + updated Lighthouse + mutation scores]
```

## Why It Matters

- **Race conditions:** Pushing and immediately reading CR feedback ignores in-flight checks. Lighthouse or a mutation shard can flip the performance gate while you're reading the verdict.
- **Stale feedback:** If CI is still settling, CR's view of coverage, bundling, and performance is incomplete.
- **Infinite loops:** Misinterpreting "pending" as failure leads to unnecessary re-triggers and churn.

The rate-limit window is a feature, not a friction—it naturally aligns re-trigger timing with CI completion.

## Related Skills

- `code-review` — retrieving and addressing review comments
- `ci-workflow` — validating changes before commit/push
- `testing-workflow` — selecting and running test suites
