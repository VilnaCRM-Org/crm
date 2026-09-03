#!/usr/bin/env sh
# scripts/ci/verify-scaffold.sh - prove the scaffolding templates still satisfy every
# static gate they claim to satisfy (issue #108).
#
# `make new-module` emits a module that must pass dependency-cruiser, TypeScript, ESLint,
# jscpd, markdownlint, Prettier and the rust-code-analysis metrics gate with zero edits.
# Nothing else notices when a change to one of those configs makes the templates
# non-compliant, because the templates are never executed by the normal suite. This gate
# generates a throwaway module, runs the real targets over the generated tree, and removes
# every generated path again.
#
# The dev container runs as root, so every generated file is root-owned on the host.
# Removal therefore happens inside the container; doing it on the runner fails with EACCES.
#
# Exit 0 = the generated scaffold cleared every gate and the worktree is clean again
# Exit 1 = a gate failed, or cleanup left the worktree dirty (the CODEOWNERS backup is kept
#          and its path printed when the restore is what failed)
# Exit 2 = refused to run: SCAFFOLD_VERIFY_TARGETS unset or naming an undeclared target,
#          probe paths already present, or a required file is missing
#
# Usage: make verify-scaffold
#
# The Makefile owns the single definition of the gate list, so run it through the target.
# Invoking this script directly requires SCAFFOLD_VERIFY_TARGETS in the environment:
#   SCAFFOLD_VERIFY_TARGETS="lint-deps lint-tsc" sh scripts/ci/verify-scaffold.sh
set -eu

MODULE="${SCAFFOLD_PROBE_MODULE:-scaffold-probe}"
FEATURE="${SCAFFOLD_PROBE_FEATURE:-probe-list}"
TARGETS="${SCAFFOLD_VERIFY_TARGETS:-}"
CODEOWNERS=".github/CODEOWNERS"

SRC_DIR="src/modules/$MODULE"
UNIT_DIR="tests/unit/modules/$MODULE"
E2E_DIR="tests/e2e/modules/$MODULE"

if [ -z "$TARGETS" ]; then
  printf 'FATAL: SCAFFOLD_VERIFY_TARGETS is unset. Run "make verify-scaffold", which owns the\n' >&2
  printf '       single definition of the gate list, instead of invoking this script bare.\n' >&2
  exit 2
fi

for probe in "$SRC_DIR" "$UNIT_DIR" "$E2E_DIR"; do
  if [ -e "$probe" ]; then
    printf 'FATAL: %s already exists; refusing to overwrite it\n' "$probe" >&2
    exit 2
  fi
done

if [ ! -f "$CODEOWNERS" ]; then
  printf 'FATAL: %s is missing\n' "$CODEOWNERS" >&2
  exit 2
fi

# The Makefile declares every command-line goal phony, so `make <typo>` reports "Nothing to
# be done" and exits 0. Without this guard a misspelled entry in SCAFFOLD_VERIFY_TARGETS
# would silently drop a gate and still green the check.
for target in $TARGETS; do
  if ! grep -qE "^${target}:" Makefile; then
    printf 'FATAL: SCAFFOLD_VERIFY_TARGETS names a target the Makefile does not define: %s\n' \
      "$target" >&2
    exit 2
  fi
done

BACKUP="$(mktemp)"
cp "$CODEOWNERS" "$BACKUP"

# Root-owned generated files cannot be unlinked by the CI runner user, so both the removal
# and the CODEOWNERS restore run inside the same container that created them.
finish() {
  code="$1"
  trap - EXIT INT TERM
  # Paths are passed as positional arguments rather than interpolated into the nested `sh -c`
  # string, so a hostile SCAFFOLD_PROBE_* value cannot be reparsed as shell syntax.
  docker compose exec -T dev sh -c 'rm -rf "$1" "$2" "$3"' _ \
    "$SRC_DIR" "$UNIT_DIR" "$E2E_DIR" >/dev/null 2>&1 || true
  docker compose exec -T dev sh -c 'cat > "$1"' _ "$CODEOWNERS" <"$BACKUP" >/dev/null 2>&1 || true
  for leftover in "$SRC_DIR" "$UNIT_DIR" "$E2E_DIR"; do
    if [ -e "$leftover" ]; then
      printf 'verify-scaffold: could not remove %s; the worktree is dirty\n' "$leftover" >&2
      code=1
    fi
  done
  # Keep the backup when the restore is what failed — deleting it would destroy the only
  # known-good copy of a file this script has already overwritten.
  if cmp -s "$BACKUP" "$CODEOWNERS"; then
    rm -f "$BACKUP"
  else
    printf 'verify-scaffold: %s was not restored; recover it from %s\n' \
      "$CODEOWNERS" "$BACKUP" >&2
    code=1
  fi
  exit "$code"
}

# The trap covers `set -e` aborts and interrupts; the success path calls finish directly.
trap 'finish "$?"' EXIT INT TERM

printf '== verify-scaffold: make new-module name=%s feature=%s ==\n' "$MODULE" "$FEATURE"
make new-module "name=$MODULE" "feature=$FEATURE"

status=0
for target in $TARGETS; do
  printf '\n== verify-scaffold: make %s ==\n' "$target"
  if ! make "$target"; then
    printf 'verify-scaffold: make %s failed against the generated scaffold\n' "$target" >&2
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  printf '\nverify-scaffold: %s/%s cleared %s\n' "$MODULE" "$FEATURE" "$TARGETS"
fi

finish "$status"
