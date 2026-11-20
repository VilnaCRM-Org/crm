#!/bin/sh
# Installs one checksum-verified Bun release into $BUN_INSTALL (issue #139).
#
# Usage: install-bun <version>
#
# Replaces `curl https://bun.sh/install | bash`, which executed an unversioned script and ran
# whatever archive it downloaded. The archive is chosen the way that script chooses it —
# architecture, libc, and the AVX2 baseline fallback on x64 — but its SHA256 is pinned below
# from the release's SHASUMS256.txt, so a corrupted or substituted download fails the build.
# Bumping Bun means bumping the version and all six digests together; the unit test in
# tests/unit/tooling/image-hardening.test.ts holds this table to package.json's packageManager.
set -eu

version="${1:?usage: install-bun <version>}"
prefix="${BUN_INSTALL:-/root/.bun}"
machine="$(uname -m)"

case "$machine" in
  x86_64) arch=x64 ;;
  aarch64 | arm64) arch=aarch64 ;;
  *) echo "install-bun: unsupported architecture ${machine}" >&2; exit 1 ;;
esac

libc=""
if [ -e "/lib/ld-musl-${machine}.so.1" ]; then
  libc="-musl"
fi

variant=""
if [ "$arch" = "x64" ] && ! grep -q avx2 /proc/cpuinfo 2>/dev/null; then
  variant="-baseline"
fi

asset="bun-linux-${arch}${libc}${variant}.zip"

case "${version}/${asset}" in
  1.4.4/bun-linux-x64.zip) sha256=bf8ccbfb2b0b80159e0f9a6d15c55317add8077534dbc6130a3edb52fccb395c ;;
  1.4.4/bun-linux-x64-baseline.zip) sha256=e0446eb55995772eb9894bebae9a6be368d985a8b9271ee124486f9946eedd76 ;;
  1.4.4/bun-linux-aarch64.zip) sha256=baa6bb36f51d6e58561e02bbea825038a9df454f673d6d776e8bbf86f8c7850e ;;
  1.4.4/bun-linux-x64-musl.zip) sha256=a5a8ccc5e74dcb883fe974f125a7bdb3b41e5195ed1b870e73f17effd3eb2b2d ;;
  1.4.4/bun-linux-x64-musl-baseline.zip) sha256=6e9c37098b293920aed28bfb51ab240e26d23bfdd9bbfecb3ad428ac166549bc ;;
  1.4.4/bun-linux-aarch64-musl.zip) sha256=57f01b02ac7113c61c935f28f38c2eab849e3c970dab21f8b640a87b1ef65009 ;;
  *) echo "install-bun: no pinned checksum for ${asset} at bun-v${version}" >&2; exit 1 ;;
esac

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

curl --retry 5 --retry-delay 2 -fsSL \
  -o "${workdir}/${asset}" \
  "https://github.com/oven-sh/bun/releases/download/bun-v${version}/${asset}"
printf '%s  %s\n' "$sha256" "${workdir}/${asset}" | sha256sum -c -

unzip -q "${workdir}/${asset}" -d "${workdir}/extract"
install -d "${prefix}/bin"
install -m 0755 "${workdir}/extract/${asset%.zip}/bun" "${prefix}/bin/bun"
ln -sf bun "${prefix}/bin/bunx"

"$prefix/bin/bun" --version
