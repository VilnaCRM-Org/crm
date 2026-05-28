#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  printf 'Usage: %s <make-target> [<make-target> ...]\n' "$0" >&2
  exit 1
fi

MAKE_BIN="${MAKE_BIN:-make}"
tmp_dir="$(mktemp -d)"
overall_status=0
cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

targets=("$@")
pids=()

for target in "${targets[@]}"; do
  log_path="$tmp_dir/$target.log"
  status_path="$tmp_dir/$target.status"

  (
    if "$MAKE_BIN" "$target" >"$log_path" 2>&1; then
      printf '0' >"$status_path"
    else
      printf '%s' "$?" >"$status_path"
    fi
  ) &

  pids+=("$!")
done

for pid in "${pids[@]}"; do
  wait "$pid"
done

for target in "${targets[@]}"; do
  log_path="$tmp_dir/$target.log"
  status_path="$tmp_dir/$target.status"
  target_status="$(cat "$status_path")"

  printf '===== %s =====\n' "$target"
  if [ -s "$log_path" ]; then
    cat "$log_path"
  else
    printf '(no output)\n'
  fi

  if [ "$target_status" -ne 0 ]; then
    overall_status=1
    printf 'ci-lint: %s failed with exit code %s\n' "$target" "$target_status"
  fi
done

exit "$overall_status"
