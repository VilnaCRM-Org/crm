#!/usr/bin/env sh
# scripts/install-rca.sh - download and install rust-code-analysis-cli
#
# Darwin is handled by the Makefile target (skipped with a warning) because
# upstream v0.0.25 publishes no macOS release asset. This script supports
# Linux x86_64 and Windows x86_64 hosts.

set -eu

: "${RCA_VERSION:?RCA_VERSION must be set by Makefile}"
: "${RCA_BIN:?RCA_BIN must be set by Makefile}"

os_name=$(uname -s 2>/dev/null || echo unknown)
arch_name=$(uname -m 2>/dev/null || echo unknown)

asset=""
expected_sha256=""
extract_cmd=""
archive=$(mktemp "${TMPDIR:-/tmp}/rca-download.XXXXXX")
trap 'rm -f "$archive"' EXIT INT TERM

case "$os_name:$arch_name" in
  Linux:x86_64)
    asset="rust-code-analysis-linux-cli-x86_64.tar.gz"
    expected_sha256="9ec2a217b8ff191e02dab5d5f2eee6158b63fd975c532b2c5d67c2e6c7249894"
    extract_cmd="tar -xz -C ./bin -f $archive"
    ;;
  MINGW*:x86_64|MSYS*:x86_64|CYGWIN*:x86_64|Windows_NT:x86_64)
    asset="rust-code-analysis-win-cli-x86_64.zip"
    expected_sha256="592e9adb0cd66c333043addd8beaa04ea692a4d531e3b6dc54a2de1f27159623"
    extract_cmd="unzip -j -qo $archive -d ./bin"
    ;;
  *)
    printf 'ERROR: rust-code-analysis-cli v%s is not supported on %s/%s\n' \
      "$RCA_VERSION" "$os_name" "$arch_name" >&2
    exit 1
    ;;
esac

installed_version=""
if [ -x "$RCA_BIN" ]; then
  installed_version=$("$RCA_BIN" --version 2>/dev/null | awk '{print $NF}' || true)
fi

if [ -x "$RCA_BIN" ] && [ "$installed_version" = "$RCA_VERSION" ]; then
  exit 0
fi

printf 'Downloading rust-code-analysis-cli v%s...\n' "$RCA_VERSION"
mkdir -p ./bin

if ! curl -fsSL \
  "https://github.com/mozilla/rust-code-analysis/releases/download/v${RCA_VERSION}/${asset}" \
  -o "$archive"; then
  printf 'ERROR: failed to download %s\n' "$asset" >&2
  rm -f "$archive"
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  actual_sha256=$(sha256sum "$archive" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  actual_sha256=$(shasum -a 256 "$archive" | awk '{print $1}')
else
  printf 'ERROR: neither sha256sum nor shasum available to verify %s\n' "$asset" >&2
  rm -f "$archive"
  exit 1
fi

if [ "$actual_sha256" != "$expected_sha256" ]; then
  printf 'ERROR: SHA256 mismatch for %s\n  expected: %s\n  actual:   %s\n' \
    "$asset" "$expected_sha256" "$actual_sha256" >&2
  rm -f "$archive"
  exit 1
fi

sh -c "$extract_cmd"

refreshed_version=""
if [ -x "$RCA_BIN" ]; then
  refreshed_version=$("$RCA_BIN" --version 2>/dev/null | awk '{print $NF}' || true)
fi

if [ "$refreshed_version" != "$RCA_VERSION" ]; then
  printf 'ERROR: rust-code-analysis-cli install produced version "%s", expected "%s" at %s\n' \
    "$refreshed_version" "$RCA_VERSION" "$RCA_BIN" >&2
  exit 1
fi
