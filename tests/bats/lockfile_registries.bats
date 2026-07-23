#!/usr/bin/env bats

# Coverage for the bun.lock resolution-provenance gate (issue #176):
# scripts/ci/check-lockfile-registries.sh, wired as `make lint-lockfile`.
# Mirrors the fixture-per-attack approach of eslint_suppressions.bats.

load './test_helper.bash'

setup() {
  SCRIPT="$PROJECT_ROOT/scripts/ci/check-lockfile-registries.sh"
  FIX="$BATS_TEST_TMPDIR/fixtures"
  mkdir -p "$FIX"
}

write_lock() {
  cat > "$FIX/$1"
}

@test "clean lockfile with only registry resolutions passes (exit 0)" {
  write_lock clean.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "ok": ["ok@1.0.0", "https://registry.npmjs.org/ok/-/ok-1.0.0.tgz"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/clean.lock"
  [ "$status" -eq 0 ]
  [[ "$output" == *"all resolutions on allowed registries"* ]]
}

@test "rogue https tarball URL is rejected (exit 1)" {
  write_lock rogue-url.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "foo": ["foo@1.0.0", "https://evil.example/foo-1.0.0.tgz"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/rogue-url.lock"
  [ "$status" -eq 1 ]
  [[ "$output" == *"https://evil.example/foo-1.0.0.tgz"* ]]
}

@test "rogue github: specifier is rejected (exit 1)" {
  write_lock rogue-spec.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "bar": ["bar@github:evil/bar#deadbeef"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/rogue-spec.lock"
  [ "$status" -eq 1 ]
  [[ "$output" == *"non-registry resolution specifiers"* ]]
}

@test "lookalike host registry.npmjs.org.evil.com is rejected (proves the anchor, exit 1)" {
  write_lock lookalike.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "baz": ["baz@1.0.0", "https://registry.npmjs.org.evil.com/baz-1.0.0.tgz"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/lookalike.lock"
  [ "$status" -eq 1 ]
}

@test "lockfileVersion bump forces re-review (exit 2)" {
  write_lock badversion.lock <<'EOF'
{
  "lockfileVersion": 2,
  "packages": {}
}
EOF
  run sh "$SCRIPT" "$FIX/badversion.lock"
  [ "$status" -eq 2 ]
}

@test "missing lockfile is a hard failure (exit 2)" {
  run sh "$SCRIPT" "$FIX/does-not-exist.lock"
  [ "$status" -eq 2 ]
}

@test "make lint-lockfile passes on the real repository bun.lock" {
  run make -C "$PROJECT_ROOT" lint-lockfile
  [ "$status" -eq 0 ]
}
