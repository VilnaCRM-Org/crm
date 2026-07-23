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

@test "solidus-escaped rogue tarball URL is rejected as a backslash escape (exit 1)" {
  write_lock esc-url.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "foo": ["foo@1.0.0", "https:\/\/evil.example\/foo-1.0.0.tgz"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/esc-url.lock"
  [ "$status" -eq 1 ]
  [[ "$output" == *"backslash escape"* ]]
}

@test "unicode-escaped rogue URL (backslash-u hides the scheme) is rejected (exit 1)" {
  write_lock uni-url.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "foo": ["foo@1.0.0", "\u0068ttps://evil.example/foo-1.0.0.tgz"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/uni-url.lock"
  [ "$status" -eq 1 ]
  [[ "$output" == *"backslash escape"* ]]
}

@test "escaped-solidus github specifier is rejected (exit 1)" {
  write_lock esc-spec.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "bar": ["bar@github:evil\/bar#deadbeef"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/esc-spec.lock"
  [ "$status" -eq 1 ]
}

@test "git+ssh (git@github.com) specifier is rejected (exit 1)" {
  write_lock gitssh.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "baz": ["baz@git+ssh://git@github.com/evil/baz.git#deadbeef"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/gitssh.lock"
  [ "$status" -eq 1 ]
}

@test "scp-style git@host specifier is rejected (exit 1)" {
  write_lock gitat.lock <<'EOF'
{
  "lockfileVersion": 1,
  "packages": {
    "baz": ["baz@git@github.com:evil/baz.git#deadbeef"]
  }
}
EOF
  run sh "$SCRIPT" "$FIX/gitat.lock"
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
