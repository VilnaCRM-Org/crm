#!/usr/bin/env sh
# scripts/docker/mockoon-entrypoint.sh - start Mockoon on the pinned spec plus the mock OAuth
# provider consent page social sign-in uses locally (specs/social-sign-in).
#
# The imported environment is built into the image (/app/base.json); the page is merged here, and
# a merge that fails stops the container before Mockoon listens.

set -eu

node /app/mockoon-social-oauth.js /app/base.json /tmp/mockoon-env.json
exec mockoon-cli start --data /tmp/mockoon-env.json --port 8080
