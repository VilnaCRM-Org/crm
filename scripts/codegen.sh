#!/usr/bin/env sh
# scripts/codegen.sh - regenerate the typed API contract artifacts.
#
# Single source of truth per transport:
#   - GraphQL: the user-service SDL (pinned by GRAPHQL_SCHEMA_VERSION in .env) ->
#     graphql-codegen -> src/api/generated/graphql.ts
#   - REST:    the user-service OpenAPI spec (pinned by OPENAPI_SPEC_VERSION in .env) ->
#     openapi-typescript -> src/api/generated/openapi.ts
#
# The two upstream versions are reconciled and asserted equal by
# scripts/check-contract-versions.sh. Generated files are build output: never hand-edit
# them, and never edit this script to silence a gate. See src/api/contracts/README.md.

set -eu

CACHE_DIR=".codegen-cache"
GENERATED_DIR="src/api/generated"

read_env() {
  # Read a bare KEY=value from .env (no interpolation, no export needed).
  grep -E "^$1=" .env | head -n1 | cut -d= -f2-
}

GRAPHQL_SCHEMA_VERSION="$(read_env GRAPHQL_SCHEMA_VERSION)"
OPENAPI_SPEC_VERSION="$(read_env OPENAPI_SPEC_VERSION)"

if [ -z "$GRAPHQL_SCHEMA_VERSION" ] || [ -z "$OPENAPI_SPEC_VERSION" ]; then
  printf 'ERROR: GRAPHQL_SCHEMA_VERSION and OPENAPI_SPEC_VERSION must be set in .env\n' >&2
  exit 1
fi

RAW_BASE="https://raw.githubusercontent.com/VilnaCRM-Org/user-service"
GRAPHQL_URL="${RAW_BASE}/${GRAPHQL_SCHEMA_VERSION}/.github/graphql-spec/spec"
OPENAPI_URL="${RAW_BASE}/${OPENAPI_SPEC_VERSION}/.github/openapi-spec/spec.yaml"

mkdir -p "$CACHE_DIR" "$GENERATED_DIR"

printf 'codegen: fetching GraphQL schema %s\n' "$GRAPHQL_SCHEMA_VERSION"
curl -fsSL --retry 3 --retry-delay 2 "$GRAPHQL_URL" -o "$CACHE_DIR/schema.graphql"

printf 'codegen: fetching OpenAPI spec %s\n' "$OPENAPI_SPEC_VERSION"
curl -fsSL --retry 3 --retry-delay 2 "$OPENAPI_URL" -o "$CACHE_DIR/openapi.yaml"

printf 'codegen: generating %s/graphql.ts\n' "$GENERATED_DIR"
CODEGEN_SCHEMA_PATH="$CACHE_DIR/schema.graphql" bun x graphql-codegen --config codegen.ts

printf 'codegen: generating %s/openapi.ts\n' "$GENERATED_DIR"
bun x openapi-typescript "$CACHE_DIR/openapi.yaml" --output "$GENERATED_DIR/openapi.ts"

printf 'codegen: done\n'
