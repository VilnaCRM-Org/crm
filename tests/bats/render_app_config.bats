#!/usr/bin/env bats

# Acceptance criterion 1 of issue #145 — "the same production build artifact runs against two
# different configs without a rebuild" — proven end to end against the real committed HTML shell:
# scripts/render-app-config.js (CLI surface) driven by scripts/docker-entrypoint.sh.
#
# Every case copies public/index.html into BATS_TEST_TMPDIR first, so the committed artifact is
# never mutated and each environment renders from the identical bytes a built image would ship.

bats_require_minimum_version 1.5.0

load './test_helper.bash'

STAGING_GRAPHQL_URL='https://staging.vilnacrm.example/graphql'
PRODUCTION_API_BASE_URL='https://api.vilnacrm.example'
PRODUCTION_GRAPHQL_URL='https://api.vilnacrm.example/graphql'

STAGING_CONFIG='{"flags":{"forgotPassword":true}'
STAGING_CONFIG="$STAGING_CONFIG,\"graphqlUrl\":\"$STAGING_GRAPHQL_URL\"}"

PRODUCTION_CONFIG='{"flags":{"forgotPassword":false}'
PRODUCTION_CONFIG="$PRODUCTION_CONFIG,\"apiBaseUrl\":\"$PRODUCTION_API_BASE_URL\""
PRODUCTION_CONFIG="$PRODUCTION_CONFIG,\"graphqlUrl\":\"$PRODUCTION_GRAPHQL_URL\"}"

setup() {
  SHELL_SOURCE="$PROJECT_ROOT/public/index.html"
  RENDERER_SOURCE="$PROJECT_ROOT/scripts/render-app-config.js"
  ENTRYPOINT="$PROJECT_ROOT/scripts/docker-entrypoint.sh"

  RENDERER="$BATS_TEST_TMPDIR/scripts/render-app-config.js"
  mkdir -p "$BATS_TEST_TMPDIR/scripts"
  cp "$RENDERER_SOURCE" "$RENDERER"
}

# Copy the committed shell into the sandbox and echo the copy's path.
copy_artifact() {
  local target="$BATS_TEST_TMPDIR/$1.html"

  cp "$SHELL_SOURCE" "$target"
  printf '%s\n' "$target"
}

# The rendered runtime configuration JSON, without its surrounding <script> tags.
config_block() {
  sed -n 's|.*<script id="app-runtime-config"[^>]*>\(.*\)</script>.*|\1|p' "$1"
}

# Write $1 to "$BATS_TEST_TMPDIR/$2.rest" with the whole runtime configuration block removed —
# handling both its committed (three-line) and rendered (single-line) shapes — so that what
# surrounds the block can be diffed byte for byte.
strip_config_block() {
  awk '
    /<script id="app-runtime-config"/ { in_block = 1 }
    in_block { if ($0 ~ /<\/script>/) { in_block = 0 }; next }
    { print }
  ' "$1" > "$BATS_TEST_TMPDIR/$2.rest"
}

@test "one built artifact renders two different runtime configurations without a rebuild" {
  local staging production
  staging="$(copy_artifact staging)"
  production="$(copy_artifact production)"

  run --separate-stderr env \
    APP_CONFIG_GRAPHQL_URL="$STAGING_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    node "$RENDERER" "$staging"
  [ "$status" -eq 0 ]
  assert_output_contains "$staging"

  run --separate-stderr env \
    APP_CONFIG_API_BASE_URL="$PRODUCTION_API_BASE_URL" \
    APP_CONFIG_GRAPHQL_URL="$PRODUCTION_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=false \
    node "$RENDERER" "$production"
  [ "$status" -eq 0 ]

  [ "$(config_block "$staging")" = "$STAGING_CONFIG" ]
  [ "$(config_block "$production")" = "$PRODUCTION_CONFIG" ]
  [ "$(config_block "$staging")" != "$(config_block "$production")" ]
}

@test "rendering changes nothing outside the runtime configuration block" {
  local staging production
  staging="$(copy_artifact staging)"
  production="$(copy_artifact production)"

  run env APP_CONFIG_GRAPHQL_URL="$STAGING_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    node "$RENDERER" "$staging"
  [ "$status" -eq 0 ]

  run env APP_CONFIG_API_BASE_URL="$PRODUCTION_API_BASE_URL" \
    APP_CONFIG_GRAPHQL_URL="$PRODUCTION_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=false \
    node "$RENDERER" "$production"
  [ "$status" -eq 0 ]

  strip_config_block "$SHELL_SOURCE" committed
  strip_config_block "$staging" staging
  strip_config_block "$production" production

  diff "$BATS_TEST_TMPDIR/committed.rest" "$BATS_TEST_TMPDIR/staging.rest"
  diff "$BATS_TEST_TMPDIR/committed.rest" "$BATS_TEST_TMPDIR/production.rest"
  diff "$BATS_TEST_TMPDIR/staging.rest" "$BATS_TEST_TMPDIR/production.rest"

  grep -q '<title>VilnaCRM</title>' "$staging"
  grep -q '<div id="root"></div>' "$production"
}

@test "re-rendering an already rendered artifact with the same environment is a no-op" {
  local artifact first
  artifact="$(copy_artifact restart)"

  run env APP_CONFIG_GRAPHQL_URL="$STAGING_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    node "$RENDERER" "$artifact"
  [ "$status" -eq 0 ]
  first="$(cat "$artifact")"

  run env APP_CONFIG_GRAPHQL_URL="$STAGING_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    node "$RENDERER" "$artifact"
  [ "$status" -eq 0 ]

  [ "$first" = "$(cat "$artifact")" ]
  [ "$(config_block "$artifact")" = "$STAGING_CONFIG" ]
}

@test "an invalid URL fails the renderer with a message on stderr" {
  local artifact
  artifact="$(copy_artifact invalid-url)"

  run --separate-stderr env APP_CONFIG_GRAPHQL_URL='not-a-url' node "$RENDERER" "$artifact"

  [ "$status" -ne 0 ]
  [[ "$stderr" == *"APP_CONFIG_GRAPHQL_URL must be an absolute URL"* ]]
  [ -z "$output" ]
  [ "$(config_block "$artifact")" = "" ]
}

@test "a non-http scheme fails the renderer with a message on stderr" {
  local artifact
  artifact="$(copy_artifact bad-scheme)"

  run --separate-stderr env APP_CONFIG_API_BASE_URL='ftp://files.example/api' \
    node "$RENDERER" "$artifact"

  [ "$status" -ne 0 ]
  [[ "$stderr" == *"APP_CONFIG_API_BASE_URL must use http or https"* ]]
}

@test "an invalid flag boolean fails the renderer with a message on stderr" {
  local artifact
  artifact="$(copy_artifact invalid-boolean)"

  run --separate-stderr env APP_CONFIG_FLAG_FORGOT_PASSWORD='yes' node "$RENDERER" "$artifact"

  [ "$status" -ne 0 ]
  [[ "$stderr" == *'APP_CONFIG_FLAG_FORGOT_PASSWORD must be exactly "true" or "false"'* ]]
  [ -z "$output" ]
}

@test "an unknown feature flag fails the renderer and lists the known flags on stderr" {
  local artifact
  artifact="$(copy_artifact unknown-flag)"

  run --separate-stderr env APP_CONFIG_FLAG_DARK_MODE='true' node "$RENDERER" "$artifact"

  [ "$status" -ne 0 ]
  [[ "$stderr" == *'names unknown feature flag "darkMode"'* ]]
  [[ "$stderr" == *'Known flags: forgotPassword.'* ]]
}

@test "the renderer refuses to run without a target argument" {
  run --separate-stderr node "$RENDERER"

  [ "$status" -ne 0 ]
  [[ "$stderr" == *"usage: node scripts/render-app-config.js <html-file>"* ]]
}

@test "docker-entrypoint.sh renders the shell and then execs its command" {
  local artifact
  artifact="$(copy_artifact entrypoint)"

  run --separate-stderr env \
    APP_CONFIG_HTML="$artifact" \
    APP_CONFIG_RENDERER="$RENDERER" \
    APP_CONFIG_GRAPHQL_URL="$STAGING_GRAPHQL_URL" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    sh "$ENTRYPOINT" echo started

  [ "$status" -eq 0 ]
  assert_output_contains 'started'
  [ "$(config_block "$artifact")" = "$STAGING_CONFIG" ]
}

@test "docker-entrypoint.sh derives both defaults from APP_ROOT" {
  local root
  root="$BATS_TEST_TMPDIR/app"
  mkdir -p "$root/dist" "$root/scripts"
  cp "$SHELL_SOURCE" "$root/dist/index.html"
  cp "$RENDERER_SOURCE" "$root/scripts/render-app-config.js"

  run --separate-stderr env \
    APP_ROOT="$root" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=true \
    sh "$ENTRYPOINT" echo started

  [ "$status" -eq 0 ]
  assert_output_contains 'started'
  [ "$(config_block "$root/dist/index.html")" = '{"flags":{"forgotPassword":true}}' ]
}

@test "docker-entrypoint.sh fails before exec when the configuration is rejected" {
  local artifact
  artifact="$(copy_artifact entrypoint-reject)"

  run --separate-stderr env \
    APP_CONFIG_HTML="$artifact" \
    APP_CONFIG_RENDERER="$RENDERER" \
    APP_CONFIG_FLAG_FORGOT_PASSWORD=maybe \
    sh "$ENTRYPOINT" echo started

  [ "$status" -ne 0 ]
  [[ "$output" != *"started"* ]]
  [[ "$stderr" == *'must be exactly "true" or "false"'* ]]
  [ "$(config_block "$artifact")" = "" ]
}

@test "docker-entrypoint.sh fails when the HTML shell is missing" {
  run --separate-stderr env \
    APP_CONFIG_HTML="$BATS_TEST_TMPDIR/absent.html" \
    APP_CONFIG_RENDERER="$RENDERER" \
    sh "$ENTRYPOINT" echo started

  [ "$status" -ne 0 ]
  [[ "$stderr" == *"docker-entrypoint: HTML shell not found at $BATS_TEST_TMPDIR/absent.html"* ]]
  [[ "$output" != *"started"* ]]
}

@test "docker-entrypoint.sh fails when the renderer is missing" {
  local artifact
  artifact="$(copy_artifact entrypoint-no-renderer)"

  run --separate-stderr env \
    APP_CONFIG_HTML="$artifact" \
    APP_CONFIG_RENDERER="$BATS_TEST_TMPDIR/absent-renderer.js" \
    sh "$ENTRYPOINT" echo started

  [ "$status" -ne 0 ]
  local expected="docker-entrypoint: renderer not found at $BATS_TEST_TMPDIR/absent-renderer.js"
  [[ "$stderr" == *"$expected"* ]]
  [[ "$output" != *"started"* ]]
}
