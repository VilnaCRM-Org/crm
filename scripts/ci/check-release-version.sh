#!/usr/bin/env bash
# Release preflight: package.json's version must be at least as high as every
# plain MAJOR.MINOR.PATCH release tag, so the bump the changelog action computes
# can never land on a tag that already exists. Usage: check-release-version.sh [repo-dir]
set -euo pipefail

repo_dir="${1:-.}"
pkg="${repo_dir}/package.json"
semver='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'

fail() {
  echo "::error::release-version: $1"
  exit 1
}

[ -f "${pkg}" ] || fail "missing ${pkg}"

version="$(
  node -pe 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).version || ""' \
    "${pkg}" 2>/dev/null
)" || fail "could not parse ${pkg}"

[ -n "${version}" ] || fail "${pkg} has no \"version\" field"
[[ "${version}" =~ ${semver} ]] || fail "${pkg} version '${version}' is not a MAJOR.MINOR.PATCH semver"

raw_tags="$(git -C "${repo_dir}" tag --list)" || fail "could not list git tags in ${repo_dir}"

tags="$(printf '%s\n' "${raw_tags}" | sed 's/^v//' | grep -E "${semver}" || true)"

if [ -z "${tags}" ]; then
  echo "release-version: OK (${version}; no release tags yet)"
  exit 0
fi

highest="$(printf '%s\n' "${tags}" | sort -V | tail -n 1)"

if [ "$(printf '%s\n%s\n' "${version}" "${highest}" | sort -V | tail -n 1)" != "${version}" ]; then
  fail "$(
    cat <<MSG
package.json is at ${version} but tag v${highest} already exists, so the next release would try to re-create an existing tag and abort mid-release.
Fix: set package.json's "version" to ${highest} so the next bump lands above every tag (the release-tag ruleset forbids deleting a v* tag). See CONTRIBUTING.md, "Releases and the changelog". Do not weaken this check.
MSG
  )"
fi

echo "release-version: OK (package.json ${version} >= highest tag v${highest})"
