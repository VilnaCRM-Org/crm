#!/usr/bin/env sh
# scripts/check-contract-versions.sh - reconcile the pinned upstream contract versions.
#
# The GraphQL schema and the OpenAPI spec both come from user-service. They must be pinned
# to the same version so a single `make codegen` produces a coherent contract surface and
# nothing drifts silently. This asserts:
#   1. .env.example GRAPHQL_SCHEMA_VERSION == .env.example OPENAPI_SPEC_VERSION
#   2. the OpenAPI version pinned in Mockoon.Dockerfile matches .env.example OPENAPI_SPEC_VERSION
#
# The pins are read from the tracked template, not the untracked local .env (issue #142), so the
# gate scores the version that is committed; `make check-env-sync` keeps the local copy aligned.
#
# Documented exception: set ALLOW_CONTRACT_VERSION_SKEW=1 to downgrade a mismatch to a
# warning (record the reason in src/api/contracts/README.md when you do).

set -eu

CONTRACT_ENV_FILE="${CONTRACT_ENV_FILE:-.env.example}"

read_env() {
  grep -E "^$1=" "$CONTRACT_ENV_FILE" | head -n1 | cut -d= -f2-
}

GRAPHQL_VER="$(read_env GRAPHQL_SCHEMA_VERSION)"
OPENAPI_VER="$(read_env OPENAPI_SPEC_VERSION)"
MOCKOON_VER="$(grep -oE 'user-service/v[0-9]+\.[0-9]+\.[0-9]+/\.github/openapi-spec' Mockoon.Dockerfile \
  | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -n1)"

if [ -z "$GRAPHQL_VER" ] || [ -z "$OPENAPI_VER" ]; then
  printf 'ERROR: GRAPHQL_SCHEMA_VERSION and OPENAPI_SPEC_VERSION must both be set in %s\n' "$CONTRACT_ENV_FILE" >&2
  exit 1
fi

# Fail hard (never silently skip) if the Mockoon pin cannot be parsed — an unparseable
# version would otherwise let the gate pass without actually verifying the Mockoon pin.
if [ -z "$MOCKOON_VER" ]; then
  printf 'ERROR: could not extract the OpenAPI version pinned in Mockoon.Dockerfile\n' >&2
  exit 1
fi

skew=0
if [ "$GRAPHQL_VER" != "$OPENAPI_VER" ]; then
  printf 'contract version skew: GraphQL=%s vs OpenAPI=%s (%s)\n' "$GRAPHQL_VER" "$OPENAPI_VER" "$CONTRACT_ENV_FILE" >&2
  skew=1
fi
if [ "$MOCKOON_VER" != "$OPENAPI_VER" ]; then
  printf 'contract version skew: Mockoon.Dockerfile=%s vs OpenAPI=%s (%s)\n' "$MOCKOON_VER" "$OPENAPI_VER" "$CONTRACT_ENV_FILE" >&2
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
