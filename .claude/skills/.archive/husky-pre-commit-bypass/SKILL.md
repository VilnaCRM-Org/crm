---
name: husky-pre-commit-bypass
description: Use when committing focused changes and husky's pre-commit make format would reformat unrelated files. Skip the hook with --no-verify and validate manually instead.
---

## Why

This project's husky pre-commit hook runs `make format` and stages all touched files. When committing focused feature work (a single bug fix, one issue), unrelated files — spec artifacts, auth source, utility files — may get reformatted and swept into your commit, bloating the diff and confusing review.

## When to apply

- You're committing focused changes to one feature / issue (not a whole-repo reformatting pass).
- You've already added and tested your intended changes.
- You want the commit diff to show only your work, not formatting noise.

## Steps

1. **Stage your intended changes**:

   ```bash
   git add path/to/your/changes
   ```

2. **Commit with `--no-verify`** to skip husky's pre-commit hook:

   ```bash
   git commit --no-verify -m "fix(#N): your message"
   ```

3. **Manually validate** the core checks:

   ```bash
   make lint              # ESLint, TypeScript, Prettier, markdown, metrics, jscpd
   make test-unit-all     # All unit tests
   make test-integration  # Integration tests
   ```

4. **Verify coverage** is not degraded (check test output).

5. **Push explicitly** to your feature branch (avoid targeting main by mistake):
   ```bash
   git push HEAD:refs/heads/feat/N-your-branch
   ```

## Example

```bash
# Focused commit: performance budgets (#117)
git add src/routes/ config/performance-budget.json
git commit --no-verify -m "fix(#117): fail closed on missing gzip budgets"

# Manual validation
make lint              # All 6 linters ✓
make test-unit-all     # 1423 tests, 133 suites ✓
make test-integration  # Coverage intact ✓

# Verify only intended files changed
git diff origin/main --name-only

# Push to feature branch
git push HEAD:refs/heads/feat/117-performance-budgets
```

## Gotchas

- **Bare `git push` targets upstream** (usually `origin/main`). Always use `HEAD:refs/heads/<your-branch>` to push to the feature branch.
- **Don't abuse `--no-verify`** — it's for focused work, not to skip real quality gates. Always run the manual checks.
- **Husky is not the enemy** — it enforces consistency. Only bypass when formatting unrelated files would obscure your change.

## When NOT to use

- You're doing a whole-repo formatting pass (run `make format` + `make lint` normally, let husky run).
- You haven't validated `make lint` and tests yet (validate first, then decide to bypass if needed).
