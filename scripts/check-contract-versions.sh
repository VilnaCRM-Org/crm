#!/usr/bin/env sh
# scripts/check-contract-versions.sh - reconcile the pinned upstream contract versions.
#
# The GraphQL schema and the OpenAPI spec both come from user-service. They must be pinned
# to the same version so a single `make codegen` produces a coherent contract surface and
# nothing drifts silently. This asserts:
#   1. .env GRAPHQL_SCHEMA_VERSION == .env OPENAPI_SPEC_VERSION
#   2. the OpenAPI version pinned in Mockoon.Dockerfile matches .env OPENAPI_SPEC_VERSION
#
# Documented exception: set ALLOW_CONTRACT_VERSION_SKEW=1 to downgrade a mismatch to a
# warning (record the reason in src/api/contracts/README.md when you do).

set -eu

read_env() {
  grep -E "^$1=" .env | head -n1 | cut -d= -f2-
}

GRAPHQL_VER="$(read_env GRAPHQL_SCHEMA_VERSION)"
OPENAPI_VER="$(read_env OPENAPI_SPEC_VERSION)"
MOCKOON_VER="$(grep -oE 'user-service/v[0-9]+\.[0-9]+\.[0-9]+/\.github/openapi-spec' Mockoon.Dockerfile \
  | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -n1)"

if [ -z "$GRAPHQL_VER" ] || [ -z "$OPENAPI_VER" ]; then
  printf 'ERROR: GRAPHQL_SCHEMA_VERSION and OPENAPI_SPEC_VERSION must both be set in .env\n' >&2
  exit 1
fi

skew=0
if [ "$GRAPHQL_VER" != "$OPENAPI_VER" ]; then
  printf 'contract version skew: GraphQL=%s vs OpenAPI=%s (.env)\n' "$GRAPHQL_VER" "$OPENAPI_VER" >&2
  skew=1
fi
if [ -n "$MOCKOON_VER" ] && [ "$MOCKOON_VER" != "$OPENAPI_VER" ]; then
  printf 'contract version skew: Mockoon.Dockerfile=%s vs OpenAPI=%s (.env)\n' "$MOCKOON_VER" "$OPENAPI_VER" >&2
  skew=1
fi

if [ "$skew" -ne 0 ]; then
  if [ "${ALLOW_CONTRACT_VERSION_SKEW:-0}" = "1" ]; then
    printf 'WARNING: contract version skew allowed via ALLOW_CONTRACT_VERSION_SKEW=1\n' >&2
    exit 0
  fi
  printf 'ERROR: reconcile the pinned versions or set ALLOW_CONTRACT_VERSION_SKEW=1 with a documented reason\n' >&2
  exit 1
fi

printf 'contract versions aligned: GraphQL=%s OpenAPI=%s Mockoon=%s\n' \
  "$GRAPHQL_VER" "$OPENAPI_VER" "$MOCKOON_VER"
