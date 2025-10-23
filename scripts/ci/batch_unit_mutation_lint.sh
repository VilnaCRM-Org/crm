#!/bin/bash
set -e

NETWORK_NAME=${NETWORK_NAME:-"website-network"}
CRM_DOMAIN=${CRM_DOMAIN:-"localhost"}
DEV_PORT=${DEV_PORT:-"3000"}
NEXT_PUBLIC_PROD_PORT=${NEXT_PUBLIC_PROD_PORT:-"3001"}
PLAYWRIGHT_TEST_PORT=${PLAYWRIGHT_TEST_PORT:-"9323"}
UI_HOST=${UI_HOST:-"0.0.0.0"}
PROD_CONTAINER_NAME=${PROD_CONTAINER_NAME:-"prod"}
PLAYWRIGHT_CONTAINER_NAME=${PLAYWRIGHT_CONTAINER_NAME:-"playwright"}
DEV_CONTAINER_NAME=${DEV_CONTAINER_NAME:-"dev"}
DOCKER_COMPOSE_DEV_FILE=${DOCKER_COMPOSE_DEV_FILE:-"docker-compose.yml"}
DOCKER_COMPOSE_TEST_FILE=${DOCKER_COMPOSE_TEST_FILE:-"docker-compose.test.yml"}
COMMON_HEALTHCHECKS_FILE=${COMMON_HEALTHCHECKS_FILE:-"common-healthchecks.yml"}
:
setup_docker_network() {
    docker network create "$NETWORK_NAME" 2>/dev/null || :
}

run_unit_tests_dind() {
    setup_docker_network
    make build
    temp_dev_container="dev-test"
    make create-temp-dev-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make copy-source-to-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make install-deps-in-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    if ! make run-unit-tests-dind TEMP_CONTAINER_NAME="$temp_dev_container"; then
        exit 1
    fi
}

run_mutation_tests_dind() {
    setup_docker_network
    make build
    temp_dev_container="dev-test"
    make create-temp-dev-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make copy-source-to-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make install-deps-in-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    if ! make run-mutation-tests-dind TEMP_CONTAINER_NAME="$temp_dev_container"; then
        exit 1
    fi
}

run_lint_tests_dind() {
    setup_docker_network
    make build
    temp_dev_container="dev-lint"
    make create-temp-dev-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make copy-source-to-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    make install-deps-in-container-dind TEMP_CONTAINER_NAME="$temp_dev_container"
    mkdir -p "lint-logs"
    : > "lint-logs/summary.log"
    if make run-eslint-tests-dind TEMP_CONTAINER_NAME="$temp_dev_container"; then
        printf "ESLint PASSED\n" | tee -a "lint-logs/summary.log" >/dev/null
    else
        printf "ESLint FAILED\n" | tee -a "lint-logs/summary.log" >/dev/null
    fi
    if make run-typescript-tests-dind TEMP_CONTAINER_NAME="$temp_dev_container"; then
        printf "TypeScript check PASSED\n" | tee -a "lint-logs/summary.log" >/dev/null
    else
        printf "TypeScript check FAILED\n" | tee -a "lint-logs/summary.log" >/dev/null
    fi
    if make run-markdown-lint-tests-dind TEMP_CONTAINER_NAME="$temp_dev_container"; then
        printf "Markdown linting PASSED\n" | tee -a "lint-logs/summary.log" >/dev/null
    else
        printf "Markdown linting FAILED\n" | tee -a "lint-logs/summary.log" >/dev/null
    fi
    failed_count=$(grep -c "FAILED" "lint-logs/summary.log" 2>/dev/null || echo "0")
    if [ "$failed_count" -gt 0 ]; then
        exit 1
    fi
}

main() {
    local crm_dir="${1:-.}"
    if [ ! -d "$crm_dir" ]; then
        exit 1
    fi
    run_unit_tests_dind
    run_mutation_tests_dind
    run_lint_tests_dind
}

case "${1:-all}" in
    test-unit)
        run_unit_tests_dind
        ;;
    test-mutation)
        run_mutation_tests_dind
        ;;
    test-lint)
        run_lint_tests_dind
        ;;
    *)
        main "$@"
        ;;
esac


