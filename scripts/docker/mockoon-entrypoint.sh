#!/usr/bin/env sh
# scripts/docker/mockoon-entrypoint.sh - start Mockoon on the pinned spec plus the social OAuth
# routes the pin does not carry yet (specs/social-sign-in, story S1.1).
#
# The imported environment is built into the image (/app/base.json); the overlay is merged here,
# at container start, because its mode, SPA origin and client IDs are runtime settings
# (MOCKOON_OAUTH_MODE, MOCKOON_SPA_ORIGIN, MOCKOON_OAUTH_<PROVIDER>_CLIENT_ID). A bad mode or
# origin stops the container before Mockoon listens, so a misconfiguration never serves.

set -eu

node /app/mockoon-social-oauth.js /app/base.json /tmp/mockoon-env.json
exec mockoon-cli start --data /tmp/mockoon-env.json --port 8080
