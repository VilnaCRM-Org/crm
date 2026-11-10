#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_stub_dir
  export USER_SERVICE_DIR="$BATS_TEST_TMPDIR/user-service"
  export BUILT_DOCKERFILE="$BATS_TEST_TMPDIR/built.Dockerfile"
  mkdir -p "$USER_SERVICE_DIR"
  cat > "$USER_SERVICE_DIR/Dockerfile" << 'DOCKERFILE'
FROM php AS frankenphp_base
RUN echo before
ARG DOCUMENTDB_CA_BUNDLE_URL=https://example.test/global-bundle.pem
ARG DOCUMENTDB_CA_BUNDLE_SHA256=abc
RUN curl -fsSL "$DOCUMENTDB_CA_BUNDLE_URL" -o "$DOCUMENTDB_CA_BUNDLE_PATH" && \
    chmod 0644 "$DOCUMENTDB_CA_BUNDLE_PATH"
RUN echo after
FROM frankenphp_base AS frankenphp_dev
DOCKERFILE
  cat > "$STUB_BIN_DIR/docker" << 'STUB'
#!/usr/bin/env bash
printf 'docker %s\n' "$*" >> "${COMMAND_LOG:?}"
if [ "$1" = image ] && [ "$2" = inspect ]; then
  [ -n "${FAKE_IMAGE_PRESENT:-}" ]
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
  run sh "$PROJECT_ROOT/scripts/local-stack/start.sh"
}

@test "local stack start fails fast when user-service is not cloned" {
  rm -rf "$USER_SERVICE_DIR"

  run_start

  [ "$status" -eq 1 ]
  assert_output_contains "user-service not found at $USER_SERVICE_DIR"
  [ ! -s "$COMMAND_LOG" ]
}

@test "local stack start appends the token TTL once and recreates php only then" {
  printf 'APP_ENV=dev\n' > "$USER_SERVICE_DIR/.env.local"

  run_start
  [ "$status" -eq 0 ]
  [ "$(cat "$USER_SERVICE_DIR/.env.local")" = \
    "$(printf '%s\n' APP_ENV=dev AUTH_ACCESS_TOKEN_TTL_SECONDS=2592000)" ]
  grep -qx 'docker compose rm --force --stop php' "$COMMAND_LOG"

  reset_command_log
  run_start
  [ "$status" -eq 0 ]
  [ "$(grep -c '^AUTH_ACCESS_TOKEN_TTL_SECONDS=' "$USER_SERVICE_DIR/.env.local")" -eq 1 ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start creates .env.local when user-service has none" {
  run_start

  [ "$status" -eq 0 ]
  [ "$(cat "$USER_SERVICE_DIR/.env.local")" = 'AUTH_ACCESS_TOKEN_TTL_SECONDS=2592000' ]
}

@test "local stack start keeps a TTL the developer already set" {
  printf 'AUTH_ACCESS_TOKEN_TTL_SECONDS=60\n' > "$USER_SERVICE_DIR/.env.local"

  run_start

  [ "$status" -eq 0 ]
  [ "$(cat "$USER_SERVICE_DIR/.env.local")" = 'AUTH_ACCESS_TOKEN_TTL_SECONDS=60' ]
  [ "$(grep -c 'docker compose rm' "$COMMAND_LOG")" -eq 0 ]
}

@test "local stack start builds the image without the DocumentDB CA bundle step" {
  run_start

  [ "$status" -eq 0 ]
  grep -qx "docker build -f - --target frankenphp_dev -t user-service-local-php $USER_SERVICE_DIR" \
    "$COMMAND_LOG"
  [ "$(cat "$BUILT_DOCKERFILE")" = "$(printf '%s\n' \
    'FROM php AS frankenphp_base' \
    'RUN echo before' \
    'RUN echo after' \
    'FROM frankenphp_base AS frankenphp_dev')" ]
}

@test "local stack start reuses a built image and then issues the session and starts the stack" {
  export FAKE_IMAGE_PRESENT=1

  run_start

  [ "$status" -eq 0 ]
  [ "$(grep -c '^docker build' "$COMMAND_LOG")" -eq 0 ]
  [ ! -e "$BUILT_DOCKERFILE" ]
  grep -qx 'docker compose up --detach --no-build --wait php database redis mailer localstack' \
    "$COMMAND_LOG"
  grep -qx 'node scripts/local-stack/issue-demo-session.mjs' "$COMMAND_LOG"
  grep -qx 'docker compose -f docker-compose.local-stack.yml up --detach --build' "$COMMAND_LOG"
  assert_output_contains 'Open http://vilnacrm.localhost and sign in as demo@vilnacrm.com'
}
