#!/usr/bin/env sh

set -u

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

docker_ready=0
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    docker_ready=1
    printf 'docker: on PATH, daemon answering\n'
  else
    printf 'docker: on PATH, daemon not answering; start Docker before make start\n'
  fi
else
  printf 'docker: not on PATH; every make target runs inside the dev container\n'
fi

dev_running=0
if [ "$docker_ready" -eq 1 ]; then
  running_services="$(docker compose ps --services --filter status=running 2>/dev/null)"
  if printf '%s\n' "$running_services" | grep -qx 'dev'; then
    dev_running=1
  fi
fi

if [ "$dev_running" -eq 1 ]; then
  printf 'compose dev service: running\n'
  if node_check="$(make check-node-version 2>&1)"; then
    printf 'make check-node-version: OK\n'
  else
    printf 'make check-node-version: FAILED\n'
  fi
  printf '%s\n' "$node_check" | sed 's/^/  /'
else
  printf 'compose dev service: not running; start the stack with: make start\n'
fi

if [ -d _bmad ]; then
  printf 'BMAD assets: _bmad/ present (local install, gitignored)\n'
else
  printf 'BMAD assets: _bmad/ missing; install with: bmalph init (gitignored on purpose)\n'
fi

exit 0
