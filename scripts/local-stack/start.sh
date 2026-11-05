#!/usr/bin/env sh
# Runs the SPA against a real user-service at http://vilnacrm.localhost.
# See "Local stack with the real user-service" in CONTRIBUTING.md.
set -eu

USER_SERVICE_DIR="${USER_SERVICE_DIR:-../user-service}"
USER_SERVICE_IMAGE=user-service-local-php
TOKEN_TTL_SECONDS=2592000
TTL_ADDED=false

if [ ! -d "$USER_SERVICE_DIR" ]; then
  echo "user-service not found at $USER_SERVICE_DIR. Clone it there or set USER_SERVICE_DIR." >&2
  exit 1
fi

if ! grep -q '^AUTH_ACCESS_TOKEN_TTL_SECONDS=' "$USER_SERVICE_DIR/.env.local" 2>/dev/null; then
  echo "AUTH_ACCESS_TOKEN_TTL_SECONDS=$TOKEN_TTL_SECONDS" >> "$USER_SERVICE_DIR/.env.local"
  TTL_ADDED=true
fi

# The DocumentDB CA bundle secures AWS connections only and its pinned digest rots whenever AWS
# rotates the file (user-service #503), so this local image is built without that one step.
if ! docker image inspect "$USER_SERVICE_IMAGE" > /dev/null 2>&1; then
  sed '/^ARG DOCUMENTDB_CA_BUNDLE_URL/,/chmod 0644 .*DOCUMENTDB_CA_BUNDLE_PATH/d' \
    "$USER_SERVICE_DIR/Dockerfile" |
    docker build -f - --target frankenphp_dev -t "$USER_SERVICE_IMAGE" "$USER_SERVICE_DIR"
fi

(
  cd "$USER_SERVICE_DIR"
  export COMPOSE_PROJECT_NAME=user-service-local
  export MAILCATCHER_SMTP_PORT=1026 HTTP_PORT=8088 HTTPS_PORT=8443 HTTP3_PORT=8443
  if [ "$TTL_ADDED" = true ]; then
    docker compose rm --force --stop php
  fi
  docker compose up --detach --no-build --wait php database redis mailer localstack
)

node scripts/local-stack/issue-demo-session.mjs
docker compose -f docker-compose.local-stack.yml up --detach --build

echo 'Open http://vilnacrm.localhost and sign in as demo@vilnacrm.com'
