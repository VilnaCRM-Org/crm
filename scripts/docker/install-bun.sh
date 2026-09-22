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
  1.3.5/bun-linux-x64.zip) sha256=7051d86a924aefea3e0b96213b5fd8f79c0793f9cae6534233e627e5c3db4669 ;;
  1.3.5/bun-linux-x64-baseline.zip) sha256=6bddacd6a65855698b9816f2d74871eda4dd0b7fa921140c6445248f94a742fd ;;
  1.3.5/bun-linux-aarch64.zip) sha256=ed01000f85bd97785228ad2845dc92a1860b8054856826d7317690ac8f8ee74b ;;
  1.3.5/bun-linux-x64-musl.zip) sha256=720d88e0e5f40450a1da91c0226f626b156eaa224876d794fa95f6ebf74f46b6 ;;
  1.3.5/bun-linux-x64-musl-baseline.zip) sha256=57997319f8b9f72ce137363c3dfcd8d401327925108bb30dc5c3257452fba524 ;;
  1.3.5/bun-linux-aarch64-musl.zip) sha256=980b567beeca875b79776d60a35b178309583df3f0973b3bae62f7244dc486ad ;;
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
