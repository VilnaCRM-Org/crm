#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  printf 'Usage: %s <make-target> [<make-target> ...]\n' "$0" >&2
  exit 1
fi

MAKE_BIN="${MAKE_BIN:-make}"
tmp_dir="$(mktemp -d)"
overall_status=0
trap 'rm -rf "$tmp_dir"' EXIT

build_safe_target() {
  local target="$1"
  local hash_output
  local target_hash

  if command -v sha256sum >/dev/null 2>&1; then
    hash_output="$(printf '%s' "$target" | sha256sum)"
  elif command -v shasum >/dev/null 2>&1; then
    hash_output="$(printf '%s' "$target" | shasum -a 256)"
  elif command -v openssl >/dev/null 2>&1; then
    hash_output="$(printf '%s' "$target" | openssl dgst -sha256)"
  else
    printf '%s\n' \
      'ERROR: build_safe_target requires sha256sum, shasum -a 256, or openssl dgst -sha256' >&2
    exit 1
  fi

  target_hash="${hash_output##*= }"
  target_hash="${target_hash%% *}"
  target_hash="$(printf '%s' "$target_hash" | cut -c1-8)"

  printf '%s_%s' "${target//[^A-Za-z0-9._-]/_}" "$target_hash"
}

targets=("$@")
pids=()

for target in "${targets[@]}"; do
  safe_target="$(build_safe_target "$target")"
  log_path="$tmp_dir/$safe_target.log"
  status_path="$tmp_dir/$safe_target.status"

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
  safe_target="$(build_safe_target "$target")"
  log_path="$tmp_dir/$safe_target.log"
  status_path="$tmp_dir/$safe_target.status"
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
