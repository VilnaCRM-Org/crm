#!/usr/bin/env sh
# scripts/ci/check-pending-contracts.sh - fail when a pending GraphQL contract outlives its pin.
#
# Every file in src/api/contracts/pending/ opens with `# pending-against: vX.Y.Z`, the
# GRAPHQL_SCHEMA_VERSION it was copied against. graphql-codegen and Apollo Server merge a
# duplicate declaration silently, so a pending file left behind by a pin bump would keep the
# stale shape alive in codegen and the local mock. A missing header or a header that no longer
# names the pin fails here, before codegen runs. See src/api/contracts/README.md.

set -eu

CONTRACT_ENV_FILE="${CONTRACT_ENV_FILE:-.env.example}"
PENDING_DIR="${PENDING_DIR:-src/api/contracts/pending}"

pin="$(grep -E '^GRAPHQL_SCHEMA_VERSION=' "$CONTRACT_ENV_FILE" | head -n1 | cut -d= -f2-)"
if [ -z "$pin" ]; then
  printf 'ERROR: GRAPHQL_SCHEMA_VERSION must be set in %s\n' "$CONTRACT_ENV_FILE" >&2
  exit 1
fi

status=0
for file in "$PENDING_DIR"/*.graphql; do
  [ -e "$file" ] || continue
  header="$(head -n1 "$file")"
  against="${header#\# pending-against: }"
  if [ "$against" = "$header" ]; then
    printf 'ERROR: %s must start with "# pending-against: <version>"\n' "$file" >&2
    status=1
  elif [ "$against" != "$pin" ]; then
    printf 'ERROR: %s is pending against %s but GRAPHQL_SCHEMA_VERSION is %s.\n' \
      "$file" "$against" "$pin" >&2
    printf '       Delete it if %s carries the declarations, or re-verify it and move its header.\n' \
      "$pin" >&2
    status=1
  fi
done

exit "$status"
