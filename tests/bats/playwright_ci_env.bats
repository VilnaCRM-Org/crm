#!/usr/bin/env bats

load './test_helper.bash'

# Guards issue #190: docker-compose.test.yml must pass the host CI flag into the
# playwright service. Without it, GitHub's CI=true never crosses the compose
# boundary and playwright.config.ts's `forbidOnly: !!process.env.CI` is inert
# inside the container. docker is stubbed in this harness (test_helper.bash), so a
# `docker compose config`-based assertion would hit the stub and pass vacuously —
# assert on the compose file text directly instead.

@test "playwright service passes the host CI flag into the container (issue #190)" {
  local compose="$PROJECT_ROOT/docker-compose.test.yml"
  [ -f "$compose" ]

  # Isolate the `playwright:` service block: from its header up to the next
  # 2-space-indented service key (nested keys are indented deeper, so they stay in).
  run awk '
    /^  playwright:/ { in_block = 1; next }
    in_block && /^  [a-zA-Z]/ { in_block = 0 }
    in_block { print }
  ' "$compose"
  [ "$status" -eq 0 ]

  # Anchor to the full list item (`- CI=${CI-}`), not just the substring, so a
  # mis-named/mis-formatted entry (e.g. `- FOO_CI=${CI-}`) cannot satisfy the gate.
  printf '%s\n' "$output" | grep -qF -- '- CI=${CI-}'
}
