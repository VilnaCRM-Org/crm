#!/usr/bin/env sh
# Runs the SPA against a real user-service at http://vilnacrm.localhost.
# See "Local stack with the real user-service" in CONTRIBUTING.md.
set -eu

USER_SERVICE_DIR="${USER_SERVICE_DIR:-../user-service}"
USER_SERVICE_IMAGE=user-service-local-php
WORKERS_IMAGE=user-service-local-workers
ENCRYPTION_KEYS='OAUTH_ENCRYPTION_KEY TWO_FACTOR_ENCRYPTION_KEY'
TOKEN_TTL_SECONDS=2592000
TTL_ADDED=false
KEYS_ADDED=false

if [ ! -d "$USER_SERVICE_DIR" ]; then
  echo "user-service not found at $USER_SERVICE_DIR. Clone it there or set USER_SERVICE_DIR." >&2
  exit 1
fi

ENV_LOCAL="$USER_SERVICE_DIR/.env.local"
ENV_DEV="$USER_SERVICE_DIR/.env.dev"

append_env_local() {
  if [ -s "$ENV_LOCAL" ] && [ -n "$(tail -c 1 "$ENV_LOCAL")" ]; then
    echo >> "$ENV_LOCAL"
  fi
  echo "$1" >> "$ENV_LOCAL"
}

env_value() {
  grep "^$2=" "$1" 2>/dev/null | tail -n 1 |
    sed -e 's/^[^=]*=//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

for key in $ENCRYPTION_KEYS; do
  dev_value="$(env_value "$ENV_DEV" "$key")"
  local_value="$(env_value "$ENV_LOCAL" "$key")"
  if [ -z "$dev_value$local_value" ]; then
    echo "$key is not set in $ENV_DEV, so the e-mail workers cannot start." >&2
    exit 1
  fi
  if [ -n "$dev_value" ] && [ -n "$local_value" ] && [ "$dev_value" != "$local_value" ]; then
    echo "$key differs between $ENV_LOCAL and $ENV_DEV, so php and the e-mail workers would" >&2
    echo "encrypt with different keys. Remove it from $ENV_LOCAL or make the values equal." >&2
    exit 1
  fi
done

if ! grep -q '^AUTH_ACCESS_TOKEN_TTL_SECONDS=' "$ENV_LOCAL" 2>/dev/null; then
  append_env_local "AUTH_ACCESS_TOKEN_TTL_SECONDS=$TOKEN_TTL_SECONDS"
  TTL_ADDED=true
fi

for key in $ENCRYPTION_KEYS; do
  if [ -z "$(env_value "$ENV_LOCAL" "$key")" ]; then
    append_env_local "$(grep "^$key=" "$ENV_DEV" | tail -n 1)"
    KEYS_ADDED=true
  fi
done

# The DocumentDB CA bundle secures AWS connections only and its pinned digest rots whenever AWS
# rotates the file (user-service #503), so the local images are built without that one step.
build_local_image() {
  if ! docker image inspect "$1" > /dev/null 2>&1; then
    sed '/^ARG DOCUMENTDB_CA_BUNDLE_URL/,/chmod 0644 .*DOCUMENTDB_CA_BUNDLE_PATH/d' \
      "$USER_SERVICE_DIR/Dockerfile" |
      docker build -f - --target "$2" -t "$1" "$USER_SERVICE_DIR"
  fi
}

build_local_image "$USER_SERVICE_IMAGE" frankenphp_dev
build_local_image "$WORKERS_IMAGE" app_workers

(
  cd "$USER_SERVICE_DIR"
  export COMPOSE_PROJECT_NAME=user-service-local
  export MAILCATCHER_SMTP_PORT=1026 HTTP_PORT=8088 HTTPS_PORT=8443 HTTP3_PORT=8443
  if [ "$TTL_ADDED" = true ]; then
    docker compose rm --force --stop php
  fi
  if [ "$KEYS_ADDED" = true ]; then
    docker compose rm --force --stop workers
  fi
  docker compose up --detach --no-build --wait php database redis mailer localstack
  docker compose up --detach --no-build workers
)

node scripts/local-stack/issue-demo-session.mjs
docker compose -f docker-compose.local-stack.yml up --detach --build
docker compose -f docker-compose.local-stack.yml restart sign-in-mock

echo "Open http://vilnacrm.localhost and sign in as ${LOCAL_DEMO_EMAIL:-local-demo@vilnacrm.com}"
echo "E-mails arrive in Mailcatcher at http://localhost:1080"
