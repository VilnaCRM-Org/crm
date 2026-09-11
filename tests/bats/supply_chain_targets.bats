#!/usr/bin/env bats

load './test_helper.bash'

setup() {
  setup_makefile_test_env
  TRIVY_IMAGE='aquasec/trivy:0.74.0@sha256:62b1e65e8869bc4b4c6aa4fa2b21595256c7c2f6018a9d9ad61caf87187c1969'
  GITLEAKS_IMAGE='ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f'
  TRIVY_RUN="docker run --rm --user $(id -u):$(id -g) -e TRIVY_CACHE_DIR=/cache -v $MAKEFILE_SANDBOX/.trivy-cache:/cache -v $MAKEFILE_SANDBOX:/repo:ro -w /repo $TRIVY_IMAGE"
  TRIVY_ARGS='--scanners vuln --severity HIGH,CRITICAL --ignore-unfixed --no-progress'
}

@test "scan-secrets runs the read-only gitleaks history scan, then the seeded-credential control" {
  run_make_target scan-secrets
  [ "$status" -eq 0 ]
  assert_log_contains "docker run --rm -v $MAKEFILE_SANDBOX:/repo:ro -w /repo $GITLEAKS_IMAGE git --redact --no-banner --exit-code 1 --config .gitleaks.toml ."
  assert_log_contains "assert-secret-scan-detects.sh GITLEAKS_IMAGE=$GITLEAKS_IMAGE"
  run awk '/gitleaks/ { print NR }' "$COMMAND_LOG"
  [ "${lines[0]}" -lt "${lines[1]}" ]
}

@test "scan-dependencies scans the production closure of bun.lock unprivileged and fails on a hit" {
  run_make_target scan-dependencies
  [ "$status" -eq 0 ]
  assert_log_contains "$TRIVY_RUN fs $TRIVY_ARGS --exit-code 1 bun.lock"
  run grep -F -- '--include-dev-deps' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
  run grep -F -- 'docker.sock' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "scan-image builds the deployable target, saves it, and scans the archive without the Docker socket" {
  run_make_target scan-image
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t crm-scan-probe -f Dockerfile --target production .'
  assert_log_contains 'docker save -o .scan-image.tar crm-scan-probe'
  assert_log_contains "$TRIVY_RUN image $TRIVY_ARGS --exit-code 1 --input .scan-image.tar"
  run grep -F -- 'docker.sock' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
  run grep -F -- 'test-harness' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}

@test "sbom writes CycloneDX documents for the saved image and the lockfile" {
  run_make_target sbom
  [ "$status" -eq 0 ]
  assert_log_contains 'docker build -t crm-scan-probe -f Dockerfile --target production .'
  assert_log_contains 'docker save -o .scan-image.tar crm-scan-probe'
  assert_log_contains "$TRIVY_RUN image --scanners vuln --no-progress --format cyclonedx --input .scan-image.tar"
  assert_log_contains "$TRIVY_RUN fs --scanners vuln --no-progress --format cyclonedx bun.lock"
  [ -d "$MAKEFILE_SANDBOX/sbom" ]
}

@test "report-dependency-audit hands the Makefile-owned scanner invocation to the audit script" {
  run_make_target report-dependency-audit
  [ "$status" -eq 0 ]
  assert_log_contains "report-dependency-audit.sh TRIVY_IMAGE=$TRIVY_IMAGE TRIVY_ARGS=$TRIVY_ARGS"
  run grep -F -- 'docker run' "$COMMAND_LOG"
  [ "$status" -ne 0 ]
}
