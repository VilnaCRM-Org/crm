---
name: review-thread-resolution-workflow
description: Use when managing multiple review threads across different reviewers to coordinate timing with CI verification before resolving threads, ensuring resolved means verified and landed.
---

# Review Thread Resolution Workflow

Use this skill when addressing **multiple review threads** from different reviewers (CodeRabbit, cubic, qlty, etc.) on a pull request. It establishes a discipline for coordinating thread resolution with CI verification.

## Core Workflow

1. **Read and understand each review comment**  
   Scan all threads from all reviewers before responding. Document what each comment is about.

2. **Document the outcome for each thread**  
   For each comment, determine and explicitly record:
   - **Fixed in code** — issue is resolved with a commit/push
   - **Replied with reasoning** — acknowledged but not changed; include rationale on the thread
   - **Deferred** — non-blocking; can address later

3. **Push fixes and replies**  
   Commit and push all code changes. Reply on each thread with the outcome, especially for "deliberately not changed" threads.

4. **Wait for CI to go terminal and green**  
   Do **not** resolve threads yet. All jobs must pass (unit, lint, integration, Lighthouse, mutation, etc.).

5. **Resolve all threads**  
   Only after CI is green, resolve threads. This establishes the discipline that "resolved thread" = verified and landed, not just acknowledged.

## Why This Pattern

- **Prevents premature resolution** — resolved threads should carry meaning (the work is done and verified), not just "I read this"
- **Reduces rework** — CI often catches issues that require follow-up; resolving early forces re-opening threads
- **Coordinates across reviewers** — multiple reviewers see the same CI status, so resolution is simultaneous and carries shared meaning
- **Creates an audit trail** — the thread's lifecycle (raised → addressed → CI verified → resolved) is preserved

## Example

You have 18 threads from three reviewers. Instead of:

1. Read comment → reply immediately → resolve → move to next

Do:

1. Read all 18 threads, note outcomes
2. Batch-reply on threads (fixed in code, or replied with reasoning)
3. Push all changes
4. **Wait for CI** (all 34 jobs passing)
5. Resolve all 18 threads together

This ensures each resolved thread has CI verification behind it.

## When Not to Use

- Single trivial comment (e.g., "typo" on a style file) — can resolve immediately if you're confident
- Auto-resolvable review types (e.g., Dependabot minor patches) — CI pass is enough signal
- Deferred improvements captured in new issues — still resolve the thread once CI passes and issue is open

## See Also

- `code-review` — addressing PR review comments
- `ci-workflow` — validating changes before commit/push/PR
