#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_stub_dir
  export USER_SERVICE_DIR="$BATS_TEST_TMPDIR/user-service"
  export BUILT_DOCKERFILE="$BATS_TEST_TMPDIR/built.Dockerfile"
  mkdir -p "$USER_SERVICE_DIR"
  printf '%s\n' 'OAUTH_ENCRYPTION_KEY=dev-oauth' 'TWO_FACTOR_ENCRYPTION_KEY=dev-2fa' \
    > "$USER_SERVICE_DIR/.env.dev"
  cat > "$USER_SERVICE_DIR/Dockerfile" << 'DOCKERFILE'
FROM php AS frankenphp_base
RUN echo before
ARG DOCUMENTDB_CA_BUNDLE_URL=https://example.test/global-bundle.pem
ARG DOCUMENTDB_CA_BUNDLE_SHA256=abc
RUN curl -fsSL "$DOCUMENTDB_CA_BUNDLE_URL" -o "$DOCUMENTDB_CA_BUNDLE_PATH" && \
    chmod 0644 "$DOCUMENTDB_CA_BUNDLE_PATH"
RUN echo after
FROM frankenphp_base AS frankenphp_dev
FROM frankenphp_base AS app_workers
DOCKERFILE
  cat > "$STUB_BIN_DIR/docker" << 'STUB'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ "$1" = image ] && [ "$2" = inspect ]; then
  case "$3" in
    user-service-local-php) [ -n "${FAKE_IMAGE_PRESENT:-}" ] ;;
    user-service-local-workers)
      [ -n "${FAKE_IMAGE_PRESENT:-}" ] && [ -z "${FAKE_WORKERS_IMAGE_ABSENT:-}" ] ;;
    *) false ;;
  esac
  exit
fi
if [ "$1" = build ]; then
  cat > "${BUILT_DOCKERFILE:?}"
fi
exit 0
STUB
  chmod +x "$STUB_BIN_DIR/docker"
  create_generic_stub node
}

run_start() {
  run "$PROJECT_ROOT/scripts/local-stack/start.sh"
}

env_local() {
  cat "$USER_SERVICE_DIR/.env.local"
}

lines() {
  printf '%s\n' "$@"
}

@test "local stack start fails fast when user-service is not cloned" {
  rm -rf "$USER_SERVICE_DIR"

  run_start

  [ "$status" -eq 1 ]
  assert_output_contains "user-service not found at $USER_SERVICE_DIR"
  [ ! -s "$COMMAND_LOG" ]
}

@test "local stack start appends the token TTL once and recreates php only then" {
  lines APP_ENV=dev OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY=dev-2fa \
    > "$USER_SERVICE_DIR/.env.local"

  run_start
  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines APP_ENV=dev OAUTH_ENCRYPTION_KEY=dev-oauth \
    TWO_FACTOR_ENCRYPTION_KEY=dev-2fa AUTH_ACCESS_TOKEN_TTL_SECONDS=2592000)" ]
  grep -qx 'docker compose rm --force --stop php' "$COMMAND_LOG"
  [ "$(grep -c 'docker compose rm --force --stop workers' "$COMMAND_LOG")" -eq 0 ]

  reset_command_log
  run_start
  [ "$status" -eq 0 ]
  [ "$(grep -c '^AUTH_ACCESS_TOKEN_TTL_SECONDS=' "$USER_SERVICE_DIR/.env.local")" -eq 1 ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start puts the token TTL on its own line after an unterminated last line" {
  printf 'APP_ENV=dev' > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines APP_ENV=dev AUTH_ACCESS_TOKEN_TTL_SECONDS=2592000 \
    OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY=dev-2fa)" ]
}

@test "local stack start creates .env.local when user-service has none" {
  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=2592000 \
    OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY=dev-2fa)" ]
}

@test "local stack start keeps a TTL the developer already set" {
  lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY=dev-oauth \
    TWO_FACTOR_ENCRYPTION_KEY=dev-2fa > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY=dev-oauth \
    TWO_FACTOR_ENCRYPTION_KEY=dev-2fa)" ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start copies the encryption keys from .env.dev once and recreates workers only then" {
  lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 > "$USER_SERVICE_DIR/.env.local"

  run_start
  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY=dev-oauth \
    TWO_FACTOR_ENCRYPTION_KEY=dev-2fa)" ]
  grep -qx 'docker compose rm --force --stop workers' "$COMMAND_LOG"
  [ "$(grep -c 'docker compose rm --force --stop php' "$COMMAND_LOG")" -eq 0 ]

  reset_command_log
  run_start
  [ "$status" -eq 0 ]
  [ "$(grep -c '^OAUTH_ENCRYPTION_KEY=' "$USER_SERVICE_DIR/.env.local")" -eq 1 ]
  [ "$(grep -c '^TWO_FACTOR_ENCRYPTION_KEY=' "$USER_SERVICE_DIR/.env.local")" -eq 1 ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start keeps encryption keys that match .env.dev, quoted or not" {
  lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 'OAUTH_ENCRYPTION_KEY="dev-oauth"' \
    "TWO_FACTOR_ENCRYPTION_KEY='dev-2fa'" > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 'OAUTH_ENCRYPTION_KEY="dev-oauth"' \
    "TWO_FACTOR_ENCRYPTION_KEY='dev-2fa'")" ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start keeps local encryption keys .env.dev does not set" {
  lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY=mine \
    TWO_FACTOR_ENCRYPTION_KEY=mine-too > "$USER_SERVICE_DIR/.env.local"
  rm "$USER_SERVICE_DIR/.env.dev"

  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY=mine \
    TWO_FACTOR_ENCRYPTION_KEY=mine-too)" ]
}

@test "local stack start stops, changing nothing, when a local key differs from .env.dev" {
  lines OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY=mine \
    > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 1 ]
  assert_output_contains "TWO_FACTOR_ENCRYPTION_KEY differs between $USER_SERVICE_DIR/.env.local"
  [[ "$output" != *mine* ]]
  [[ "$output" != *dev-2fa* ]]
  [ "$(env_local)" = "$(lines OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY=mine)" ]
  [ ! -s "$COMMAND_LOG" ]
}

@test "local stack start fills an empty local encryption key from .env.dev" {
  lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY= \
    'TWO_FACTOR_ENCRYPTION_KEY=""' > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 0 ]
  [ "$(env_local)" = "$(lines AUTH_ACCESS_TOKEN_TTL_SECONDS=60 OAUTH_ENCRYPTION_KEY= \
    'TWO_FACTOR_ENCRYPTION_KEY=""' OAUTH_ENCRYPTION_KEY=dev-oauth \
    TWO_FACTOR_ENCRYPTION_KEY=dev-2fa)" ]
  grep -qx 'docker compose rm --force --stop workers' "$COMMAND_LOG"
}

@test "local stack start fails fast, changing nothing, when .env.dev has an empty key" {
  lines OAUTH_ENCRYPTION_KEY=dev-oauth TWO_FACTOR_ENCRYPTION_KEY= \
    > "$USER_SERVICE_DIR/.env.dev"

  run_start

  [ "$status" -eq 1 ]
  assert_output_contains "TWO_FACTOR_ENCRYPTION_KEY is not set in $USER_SERVICE_DIR/.env.dev"
  [ ! -e "$USER_SERVICE_DIR/.env.local" ]
  [ ! -s "$COMMAND_LOG" ]
}

@test "local stack start fails fast when .env.dev has no key for the workers" {
  lines OAUTH_ENCRYPTION_KEY=dev-oauth > "$USER_SERVICE_DIR/.env.dev"

  run_start

  [ "$status" -eq 1 ]
  assert_output_contains "TWO_FACTOR_ENCRYPTION_KEY is not set in $USER_SERVICE_DIR/.env.dev"
  [ ! -s "$COMMAND_LOG" ]
}

@test "local stack start builds both images without the DocumentDB CA bundle step" {
  run_start

  [ "$status" -eq 0 ]
  grep -qx "docker build -f - --target frankenphp_dev -t user-service-local-php $USER_SERVICE_DIR" \
    "$COMMAND_LOG"
  grep -qx "docker build -f - --target app_workers -t user-service-local-workers $USER_SERVICE_DIR" \
    "$COMMAND_LOG"
  [ "$(cat "$BUILT_DOCKERFILE")" = "$(lines \
    'FROM php AS frankenphp_base' \
    'RUN echo before' \
    'RUN echo after' \
    'FROM frankenphp_base AS frankenphp_dev' \
    'FROM frankenphp_base AS app_workers')" ]
}

@test "local stack start builds only the missing workers image" {
  export FAKE_IMAGE_PRESENT=1 FAKE_WORKERS_IMAGE_ABSENT=1

  run_start

  [ "$status" -eq 0 ]
  [ "$(grep -c '^docker build' "$COMMAND_LOG")" -eq 1 ]
  grep -qx "docker build -f - --target app_workers -t user-service-local-workers $USER_SERVICE_DIR" \
    "$COMMAND_LOG"
}

@test "local stack start reuses built images and then starts workers, the session and the stack" {
  export FAKE_IMAGE_PRESENT=1

  run_start

  [ "$status" -eq 0 ]
  [ "$(grep -c '^docker build' "$COMMAND_LOG")" -eq 0 ]
  [ ! -e "$BUILT_DOCKERFILE" ]
  [ "$(grep '^docker compose up' "$COMMAND_LOG" | head -n 2)" = "$(lines \
    'docker compose up --detach --no-build --wait php database redis mailer localstack' \
    'docker compose up --detach --no-build workers')" ]
  grep -qx 'node scripts/local-stack/issue-demo-session.mjs' "$COMMAND_LOG"
  grep -qx 'docker compose -f docker-compose.local-stack.yml up --detach --build' "$COMMAND_LOG"
  [ "$(grep -n 'docker compose -f docker-compose.local-stack.yml' "$COMMAND_LOG" | tail -1 | cut -d: -f2-)" = \
    'docker compose -f docker-compose.local-stack.yml restart sign-in-mock' ]
  assert_output_contains 'Open http://vilnacrm.localhost and sign in as local-demo@vilnacrm.com'
  assert_output_contains 'E-mails arrive in Mailcatcher at http://localhost:1080'
}
