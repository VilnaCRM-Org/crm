#!/bin/bash
set -e
NETWORK_NAME=${NETWORK_NAME:-"crm-network"}
CRM_DOMAIN=${CRM_DOMAIN:-"localhost"}
DEV_PORT=${DEV_PORT:-"3000"}
NEXT_PUBLIC_PROD_PORT=${NEXT_PUBLIC_PROD_PORT:-"3001"}
PLAYWRIGHT_TEST_PORT=${PLAYWRIGHT_TEST_PORT:-"9323"}
UI_HOST=${UI_HOST:-"0.0.0.0"}
PROD_CONTAINER_NAME=${PROD_CONTAINER_NAME:-"crm-prod"}
DOCKER_COMPOSE_DEV_FILE=${DOCKER_COMPOSE_DEV_FILE:-"docker-compose.yml"}
DOCKER_COMPOSE_TEST_FILE=${DOCKER_COMPOSE_TEST_FILE:-"docker-compose.test.yml"}
COMMON_HEALTHCHECKS_FILE=${COMMON_HEALTHCHECKS_FILE:-"common-healthchecks.yml"}

COMPOSE_ARGS=""
if [ -n "$COMMON_HEALTHCHECKS_FILE" ] && [ -s "$COMMON_HEALTHCHECKS_FILE" ]; then
    COMPOSE_ARGS="$COMPOSE_ARGS -f $COMMON_HEALTHCHECKS_FILE"
fi
COMPOSE_ARGS="$COMPOSE_ARGS -f $DOCKER_COMPOSE_TEST_FILE"
setup_docker_network() {
    docker network create "$NETWORK_NAME" 2>/dev/null || :
}
run_memory_leak_tests_dind() {
    # TODO: Remove CodeBuild skip once Chrome/CDP timeout issues are resolved
    if [ -n "$CODEBUILD_BUILD_ID" ] || [ -n "$AWS_REGION" ]; then
        echo "🚧 CodeBuild detected - skipping memory leak tests due to known Chrome/CDP issues"
        echo "📝 TODO: Re-enable once CodeBuild container constraints are resolved"
        echo "✅ Memory leak tests: SKIPPED (would run in other CI environments)"
        mkdir -p memory-leak-logs
        echo "Memory leak tests skipped in CodeBuild environment" > memory-leak-logs/test-execution.log
        return 0
    fi

    make start-prod

    export NEXT_PUBLIC_CONTINUOUS_DEPLOYMENT_HEADER_NAME=no-aws-header-name
    export NEXT_PUBLIC_CONTINUOUS_DEPLOYMENT_HEADER_VALUE=no-aws-header-value

    if ! make memory-leak-dind; then
        docker compose -p memleak -f docker-compose.memory-leak.yml logs --tail=30 memory-leak || true
        exit 1
    fi

    mkdir -p "memory-leak-logs"
    docker compose -p memleak -f docker-compose.memory-leak.yml cp "memory-leak:/app/src/test/memory-leak/results/." "memory-leak-logs/" 2>/dev/null || :
    docker compose -p memleak -f docker-compose.memory-leak.yml logs memory-leak > "memory-leak-logs/test-execution.log" 2>&1 || true
}

run_lighthouse_desktop_dind() {
    setup_docker_network

    exit_code=0
    if (
        set -e
        make start-prod
        make install-chromium-lhci
        docker compose ${COMPOSE_ARGS} cp "lighthouserc.desktop.js" "prod:/app/"
        make test-chromium
        make lighthouse-desktop-dind
        mkdir -p lhci-reports-desktop
        docker compose ${COMPOSE_ARGS} cp "prod:/app/lhci-reports-desktop/." "lhci-reports-desktop/" 2>/dev/null || :
    ); then
        :
    else
        exit_code=$?
    fi

    docker compose ${COMPOSE_ARGS} exec -T prod sh -lc 'rm -rf /app/lhci-reports-mobile /app/lhci-reports-desktop /app/lighthouserc.mobile.js /app/lighthouserc.desktop.js' 2>/dev/null || :
    docker compose ${COMPOSE_ARGS} down --volumes --remove-orphans || true
    docker network rm "$NETWORK_NAME" 2>/dev/null || :

    if [ "$exit_code" -ne 0 ]; then
        exit "$exit_code"
    fi
}

run_lighthouse_mobile_dind() {
    setup_docker_network

    exit_code=0
    if (
        set -e
        make start-prod
        make install-chromium-lhci
        docker compose ${COMPOSE_ARGS} cp "lighthouserc.mobile.js" "prod:/app/"
        make test-chromium
        make lighthouse-mobile-dind    
        mkdir -p lhci-reports-mobile
        docker compose ${COMPOSE_ARGS} cp "prod:/app/lhci-reports-mobile/." "lhci-reports-mobile/" 2>/dev/null || :
    ); then
        :
    else
        exit_code=$?
    fi

    docker compose ${COMPOSE_ARGS} exec -T prod sh -lc 'rm -rf /app/lhci-reports-mobile /app/lhci-reports-desktop /app/lighthouserc.mobile.js /app/lighthouserc.desktop.js' 2>/dev/null || :
    docker compose ${COMPOSE_ARGS} down --volumes --remove-orphans || true
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

