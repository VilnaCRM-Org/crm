#!/usr/bin/env sh
# scripts/check-env-sync.sh - assert .env and .env.example declare the same variable keys.
#
# .env.example is the committed template every downstream repo/fork copies. It must expose
# exactly the variables the real .env declares — no more, no less — so configuration keys can
# never drift out of the template unnoticed. Only KEYS are compared, never values (the local
# .env carries real/local values while .env.example carries placeholders). Wired into
# `make lint` and CI lint; run standalone via `make check-env-sync`.

set -eu

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

for f in "$ENV_FILE" "$EXAMPLE_FILE"; do
  if [ ! -f "$f" ]; then
    printf 'ERROR: %s is missing\n' "$f" >&2
    exit 1
  fi
done

extract_keys() {
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$1" | cut -d= -f1 | sort -u
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
  printf 'Reconcile .env and .env.example so they declare the same variable keys.\n' >&2
  exit 1
fi

key_count="$(wc -l <"$tmp_dir/env.keys" | tr -d ' ')"
printf 'env sync OK: .env and .env.example declare the same %s keys\n' "$key_count"
