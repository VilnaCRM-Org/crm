#!/usr/bin/env bats
#
# Contract (issue #193): every source file (`.ts`/`.tsx`/`.js`/`.jsx` — the only extensions a
# runner can execute) under the five test roots that DECLARES tests (a top-level
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

# jest --listTests prints ABSOLUTE container paths; strip to repo-relative. Capture jest's exit
# status BEFORE the sed pipe (which would mask it): a non-zero exit means broken config OR a
# crash after partial output — either way the discovered set would be silently partial, so fail
# hard rather than hand back a truncated list. (`--listTests` exits 1 when no tests match, which
# also surfaces a silently-narrowed suite.) stderr is captured (not discarded) and replayed on
# failure so a broken config / module-resolution error is visible in the CI log, while stdout
# stays clean for parsing.
list_jest() {
  local out status err
  err="$(mktemp)"
  out="$(cd "$PROJECT_ROOT" && TEST_ENV="$1" bun x jest --listTests 2>"$err")"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "list_jest($1): 'jest --listTests' exited $status (broken config or no tests)" >&2
    cat "$err" >&2 || true
    rm -f "$err"
    return "$status"
  fi
  rm -f "$err"
  printf '%s\n' "$out" | sed "s|^$PROJECT_ROOT/||"
}

# Every e2e/visual spec uses test.describe, so the JSON reporter nests specs inside child suites
# — extract `.file` RECURSIVELY (a flat `.suites[].specs[].file` would miss them and produce
# false orphans). `.file` is config-root-relative = repo-relative (config sits at repo root).
# Playwright/dotenv prints `◇ injected env ...` banner lines to stdout before the JSON, so slice
# from the first line that opens the top-level object (`^{`). Prod mode lists 3 projects
# (chromium/firefox/webkit) so each spec appears 3× — deduped downstream by `sort -u`.
list_playwright() {
  # Capture playwright's own exit status before parsing, so a listing failure (broken config, or
  # a crash after partial output) fails the gate instead of being masked by the parse pipe. The
  # trailing `bun -e` parse is the function's last stage, so a malformed-JSON parse error also
  # propagates as a non-zero return. stderr is captured and replayed on failure (not discarded to
  # /dev/null) so the runner's diagnostics reach the CI log, while stdout stays clean JSON.
  local raw status err
  err="$(mktemp)"
  raw="$(cd "$PROJECT_ROOT" && bun x playwright test --list --reporter=json tests/e2e tests/visual 2>"$err")"
  status=$?
  if [ "$status" -ne 0 ]; then
    echo "list_playwright: 'playwright test --list' exited $status" >&2
    cat "$err" >&2 || true
    rm -f "$err"
    return "$status"
  fi
  rm -f "$err"
  printf '%s' "$raw" \
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
  # Capture grep's exit status BEFORE the sort pipe, which would otherwise mask it: grep exits
  # 0 (matches), 1 (no matches — valid), or >1 (a real error, e.g. a missing/unreadable root).
  # A silently-partial declared set would let an entire test root vanish undetected.
  local matches status
  matches="$(cd "$PROJECT_ROOT" \
    && grep -rlE --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
      '^[[:space:]]*(test|it|describe)(\.[A-Za-z]+)*\(' -- $TEST_ROOTS)"
  status=$?
  if [ "$status" -gt 1 ]; then
    echo "declared_files: grep failed (status $status) — a test root is missing or unreadable" >&2
    return "$status"
  fi
  [ -n "$matches" ] && printf '%s\n' "$matches" | sort -u
  return 0
}

discovered_files() {
  # Collect each runner's list into a variable and propagate its status (|| return) BEFORE the
  # sort pipe. Relying on the final `sort` status would mask a runner that failed after emitting
  # partial output — its truncated list could then hide orphans.
  local client integration server playwright
  client="$(list_jest client)" || return $?
  integration="$(list_jest integration)" || return $?
  server="$(list_jest server)" || return $?
  playwright="$(list_playwright)" || return $?
  printf '%s\n%s\n%s\n%s\n' "$client" "$integration" "$server" "$playwright" \
    | sed 's|^\./||' \
    | grep -v '^[[:space:]]*$' \
    | sort -u
}

@test "every test-declaring file is discovered by a runner" {
  local declared discovered orphans
  # Separate declaration from assignment so the command-substitution status is not masked by
  # `local`, and propagate a real inventory-scan failure instead of proceeding on a partial list.
  declared="$(declared_files)" || return 1
  discovered="$(discovered_files)" || return 1
  orphans="$(comm -23 <(printf '%s\n' "$declared") <(printf '%s\n' "$discovered"))"
  if [ -n "$orphans" ]; then
    echo 'Undiscovered test-declaring files (matched by no runner):' >&2
    echo "$orphans" >&2
    return 1
  fi
}

@test "no runner discovers zero tests (discovery not silently narrowed)" {
  local env listing
  # Capture each listing and propagate its status (a runner that errors returns non-zero) before
  # counting, so a broken/partial listing fails loudly rather than passing on a non-zero count.
  for env in client integration server; do
    listing="$(list_jest "$env")" || {
      echo "jest TEST_ENV=$env listing failed" >&2
      return 1
    }
    if [ "$(printf '%s' "$listing" | grep -c .)" -eq 0 ]; then
      echo "jest TEST_ENV=$env discovered zero test files" >&2
      return 1
    fi
  done
  listing="$(list_playwright)" || {
    echo 'playwright listing failed' >&2
    return 1
  }
  if [ "$(printf '%s' "$listing" | grep -c .)" -eq 0 ]; then
    echo 'playwright discovered zero spec files' >&2
    return 1
  fi
}
