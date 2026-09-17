#!/usr/bin/env sh
# scripts/check-env-sync.sh - assert the local .env mirrors the tracked .env.example.
#
# .env.example is the committed template (issue #142 untracked .env, so the template is the only
# versioned copy every downstream repo/fork, CI run and container build starts from). The local
# .env is bootstrapped from it by `make` and then carries real/local values, so two things are
# compared and one deliberately is not:
#   1. KEYS — both files must declare exactly the same variables, so a key added to the template
#      after a pull cannot stay silently missing locally (and vice versa).
#   2. CONTRACT PINS — the upstream user-service pins (GRAPHQL_SCHEMA_VERSION,
#      OPENAPI_SPEC_VERSION and their URL templates) are build inputs, not environment
#      configuration: codegen, the
#      contract gates and the mock containers must all resolve the same version, and the tracked
#      value lives in .env.example. Their VALUES must therefore match too.
#   3. Every other value is never compared — that is where local ports, URLs and credentials go.
# Wired into `make lint` and CI lint; run standalone via `make check-env-sync`.

set -eu

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"
TRACKED_VALUE_KEYS="GRAPHQL_SCHEMA_VERSION GRAPHQL_SCHEMA_URL OPENAPI_SPEC_VERSION OPENAPI_SPEC_URL"

for f in "$ENV_FILE" "$EXAMPLE_FILE"; do
  if [ ! -f "$f" ]; then
    printf 'ERROR: %s is missing\n' "$f" >&2
    if [ "$f" = "$ENV_FILE" ]; then
      printf 'Run "make env-bootstrap" to copy it from %s.\n' "$EXAMPLE_FILE" >&2
    fi
    exit 1
  fi
done

extract_keys() {
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$1" | cut -d= -f1 | sort -u
}

read_value() {
  grep -E "^$2=" "$1" | head -n1 | cut -d= -f2-
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

extract_keys "$ENV_FILE" >"$tmp_dir/env.keys"
extract_keys "$EXAMPLE_FILE" >"$tmp_dir/example.keys"

only_env="$(comm -23 "$tmp_dir/env.keys" "$tmp_dir/example.keys")"
only_example="$(comm -13 "$tmp_dir/env.keys" "$tmp_dir/example.keys")"

status=0
if [ -n "$only_env" ]; then
  printf 'ERROR: declared in %s but missing from %s:\n%s\n' \
    "$ENV_FILE" "$EXAMPLE_FILE" "$only_env" >&2
  status=1
fi
if [ -n "$only_example" ]; then
  printf 'ERROR: declared in %s but missing from %s:\n%s\n' \
    "$EXAMPLE_FILE" "$ENV_FILE" "$only_example" >&2
  status=1
fi

if [ "$status" -ne 0 ]; then
  printf 'Reconcile %s and %s so they declare the same variable keys.\n' \
    "$ENV_FILE" "$EXAMPLE_FILE" >&2
  exit 1
fi

for key in $TRACKED_VALUE_KEYS; do
  env_value="$(read_value "$ENV_FILE" "$key")"
  example_value="$(read_value "$EXAMPLE_FILE" "$key")"
  if [ "$env_value" != "$example_value" ]; then
    printf 'ERROR: %s is %s in %s but %s in %s\n' \
      "$key" "${env_value:-<unset>}" "$ENV_FILE" \
      "${example_value:-<unset>}" "$EXAMPLE_FILE" >&2
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  printf 'The contract pins are tracked in %s; copy those lines into %s (bump them there).\n' \
    "$EXAMPLE_FILE" "$ENV_FILE" >&2
  exit 1
fi

key_count="$(wc -l <"$tmp_dir/env.keys" | tr -d ' ')"
printf 'env sync OK: %s mirrors %s (%s keys, contract pins aligned)\n' \
  "$ENV_FILE" "$EXAMPLE_FILE" "$key_count"
