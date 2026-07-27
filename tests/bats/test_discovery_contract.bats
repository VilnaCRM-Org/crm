#!/usr/bin/env bats
#
# Contract (issue #193): every file under the five test roots that DECLARES tests (a top-level
# `test(` / `it(` / `describe(`, including CHAINED modifiers — `.each`/`.skip`/`.only`/`.fixme`
# and combinations like `test.concurrent.each(` / `describe.each.only(` — via the
# `(\.[A-Za-z]+)*` group) must be DISCOVERED by a runner. Jest test-match is suffix-exact and
# Playwright's is directory+glob; nothing else proves a declared spec is actually executed. A
# spec named `tests/e2e/foo.test.ts` (Jest-habit suffix, discovered by no runner) or
# `tests/integration/bar.test.tsx` (missing the `.integration` infix) type-checks, lints clean,
# and never runs — a green check certifying a test that never executed. This gate closes that.
#
# Known future false-positive vector — do NOT widen the grep to fix it: a shared-suite helper
# (describe/it inside an exported function) placed under these roots would flag. Repo convention
# keeps such helpers in tests/utils/ and tests/builders/ (outside the roots); the fix is moving
# the file, never editing this grep.

load './test_helper.bash'

TEST_ROOTS='tests/unit tests/integration tests/apollo-server tests/e2e tests/visual'

# jest --listTests prints ABSOLUTE container paths; strip to repo-relative.
list_jest() {
  ( cd "$PROJECT_ROOT" && TEST_ENV="$1" bun x jest --listTests 2>/dev/null ) \
    | sed "s|^$PROJECT_ROOT/||"
}

# Every e2e/visual spec uses test.describe, so the JSON reporter nests specs inside child suites
# — extract `.file` RECURSIVELY (a flat `.suites[].specs[].file` would miss them and produce
# false orphans). `.file` is config-root-relative = repo-relative (config sits at repo root).
# Playwright/dotenv prints `◇ injected env ...` banner lines to stdout before the JSON, so slice
# from the first line that opens the top-level object (`^{`). Prod mode lists 3 projects
# (chromium/firefox/webkit) so each spec appears 3× — deduped downstream by `sort -u`.
list_playwright() {
  ( cd "$PROJECT_ROOT" && bun x playwright test --list --reporter=json tests/e2e tests/visual 2>/dev/null ) \
    | sed -n '/^{/,$p' \
    | bun -e '
        const seen = new Set();
        const walk = (n) => {
          if (n && typeof n === "object") {
            if (typeof n.file === "string") seen.add(n.file);
            Object.values(n).forEach(walk);
          }
        };
        walk(JSON.parse(await Bun.stdin.text()));
        console.log([...seen].join("\n"));
      '
}

declared_files() {
  ( cd "$PROJECT_ROOT" \
    && grep -rlE '^[[:space:]]*(test|it|describe)(\.[A-Za-z]+)*\(' $TEST_ROOTS ) \
    | sort -u
}

discovered_files() {
  {
    list_jest client
    list_jest integration
    list_jest server
    list_playwright
  } | sed 's|^\./||' | sort -u
}

@test "every test-declaring file is discovered by a runner" {
  local declared discovered orphans
  declared="$(declared_files)"
  discovered="$(discovered_files)"
  orphans="$(comm -23 <(printf '%s\n' "$declared") <(printf '%s\n' "$discovered"))"
  if [ -n "$orphans" ]; then
    echo 'Undiscovered test-declaring files (matched by no runner):' >&2
    echo "$orphans" >&2
    return 1
  fi
}

@test "no runner discovers zero tests (discovery not silently narrowed)" {
  local env count
  for env in client integration server; do
    count="$(list_jest "$env" | grep -c .)"
    if [ "$count" -eq 0 ]; then
      echo "jest TEST_ENV=$env discovered zero test files" >&2
      return 1
    fi
  done
  count="$(list_playwright | grep -c .)"
  if [ "$count" -eq 0 ]; then
    echo 'playwright discovered zero spec files' >&2
    return 1
  fi
}
