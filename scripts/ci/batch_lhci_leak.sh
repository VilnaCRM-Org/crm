#!/bin/bash
set -e
NETWORK_NAME=${NETWORK_NAME:-"crm-network"}
CRM_DOMAIN=${CRM_DOMAIN:-"localhost"}
DEV_PORT=${DEV_PORT:-"3000"}
REACT_APP_PROD_PORT=${REACT_APP_PROD_PORT:-"3001"}
PLAYWRIGHT_TEST_PORT=${PLAYWRIGHT_TEST_PORT:-"9324"}
UI_HOST=${UI_HOST:-"0.0.0.0"}
PROD_CONTAINER_NAME=${PROD_CONTAINER_NAME:-"prod"}
DOCKER_COMPOSE_DEV_FILE=${DOCKER_COMPOSE_DEV_FILE:-"docker-compose.yml"}
DOCKER_COMPOSE_TEST_FILE=${DOCKER_COMPOSE_TEST_FILE:-"docker-compose.test.yml"}
COMMON_HEALTHCHECKS_FILE=${COMMON_HEALTHCHECKS_FILE:-"common-healthchecks.yml"}
MOCKOON_PORT=${MOCKOON_PORT:-"8080"}

# Application-stack commands need the base service definitions: common-healthchecks.yml
# only overrides services and is invalid when Compose cannot see their image/build config.
LIGHTHOUSE_COMPOSE_ARGS=(-f "$DOCKER_COMPOSE_DEV_FILE" -f "$DOCKER_COMPOSE_TEST_FILE")
if [ -n "$COMMON_HEALTHCHECKS_FILE" ] && [ -s "$COMMON_HEALTHCHECKS_FILE" ]; then
    LIGHTHOUSE_COMPOSE_ARGS+=(-f "$COMMON_HEALTHCHECKS_FILE")
fi

setup_docker_network() {
    docker network create "$NETWORK_NAME" 2>/dev/null || :
}

collect_lighthouse_reports() {
    local report_dir="lhci-reports-${1:?Lighthouse mode is required}"
    mkdir -p "$report_dir/raw" 2>/dev/null || :
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "prod:/app/$report_dir/." "$report_dir/" 2>/dev/null || :
    # autorun can fail at assertions before filesystem upload creates exported reports.
    # Retain the original LHRs independently, before the application container is removed.
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "prod:/app/.lighthouseci/." "$report_dir/raw/" 2>/dev/null || :
}
run_memory_leak_tests_dind() {
    setup_docker_network

    export REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_NAME=no-aws-header-name
    export REACT_APP_CONTINUOUS_DEPLOYMENT_HEADER_VALUE=no-aws-header-value

    exit_code=0
    if (
        export DIND=1
        # CodeBuild's headless Chromium can stall during GPU initialization.
        # Preserve an explicit override for controlled comparisons.
        export MEMLAB_DISABLE_GPU="${MEMLAB_DISABLE_GPU:-1}"
        REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make build-prod &&
            REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make start-prod &&
            make patch-prod-mockoon-url &&
            DIND=1 make memory-leak-dind
    ); then
        :
    else
        exit_code=$?
    fi

    # The Makefile memory target collects reports before its own always-run teardown.
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" down --volumes --remove-orphans || true
    docker network rm "$NETWORK_NAME" 2>/dev/null || :

    if [ "$exit_code" -ne 0 ]; then
        exit "$exit_code"
    fi
}

run_lighthouse_desktop_dind() {
    setup_docker_network

    exit_code=0
    if (
        REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make build-prod &&
            REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make start-prod &&
            make patch-prod-mockoon-url &&
            make install-chromium-lhci &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" exec -T prod sh -lc 'mkdir -p /app/lighthouse' &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "lighthouse/." "prod:/app/lighthouse/" &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "config/performance-budget.json" "prod:/app/config/performance-budget.json" &&
            make test-chromium &&
            make lighthouse-desktop-dind
    ); then
        exit_code=0
    else
        exit_code=$?
    fi

    collect_lighthouse_reports desktop
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" exec -T prod sh -lc 'rm -rf /app/lhci-reports-mobile /app/lhci-reports-desktop /app/lighthouse' 2>/dev/null || :
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" down --volumes --remove-orphans || true
    docker network rm "$NETWORK_NAME" 2>/dev/null || :

    if [ "$exit_code" -ne 0 ]; then
        exit "$exit_code"
    fi
}

run_lighthouse_mobile_dind() {
    setup_docker_network

    exit_code=0
    if (
        REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make build-prod &&
            REACT_APP_MOCKOON_URL="http://mockoon:${MOCKOON_PORT:-8080}" make start-prod &&
            make patch-prod-mockoon-url &&
            make install-chromium-lhci &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" exec -T prod sh -lc 'mkdir -p /app/lighthouse' &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "lighthouse/." "prod:/app/lighthouse/" &&
            docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" cp "config/performance-budget.json" "prod:/app/config/performance-budget.json" &&
            make test-chromium &&
            make lighthouse-mobile-dind
    ); then
        exit_code=0
    else
        exit_code=$?
    fi

    collect_lighthouse_reports mobile
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" exec -T prod sh -lc 'rm -rf /app/lhci-reports-mobile /app/lhci-reports-desktop /app/lighthouse' 2>/dev/null || :
    docker compose "${LIGHTHOUSE_COMPOSE_ARGS[@]}" down --volumes --remove-orphans || true
    docker network rm "$NETWORK_NAME" 2>/dev/null || :
    if [ "$exit_code" -ne 0 ]; then
        exit "$exit_code"
    fi
}

main() {
    crm_dir="${1:-.}"
    if [ ! -d "$crm_dir" ]; then
        exit 1
    fi
    run_memory_leak_tests_dind "$crm_dir"
    run_lighthouse_desktop_dind "$crm_dir"
    run_lighthouse_mobile_dind "$crm_dir"
}

case "${1:-all}" in
    test-memory-leak)
        run_memory_leak_tests_dind
        ;;
    test-lighthouse-desktop)
        run_lighthouse_desktop_dind
        ;;
    test-lighthouse-mobile)
        run_lighthouse_mobile_dind
        ;;
    *)
        main "$@"
        ;;
	esac
