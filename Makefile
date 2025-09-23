-include .env
-include .env.local
-include .env.production
-include .env.production.local
-include .env.development
-include .env.development.local
-include .env.ci

export

DOCKER_COMPOSE              = docker compose

BIN_DIR                     = ./node_modules/.bin
JEST_BIN                    = $(BIN_DIR)/jest
PLAYWRIGHT_BIN              = $(BIN_DIR)/playwright

CRACO_BUILD                 = pnpm exec -- craco build
STORYBOOK_PORT				?= 6006
STORYBOOK_CMD         		= pnpm exec -- storybook dev -p $(STORYBOOK_PORT)

TEST_DIR_BASE               = ./tests
TEST_DIR_APOLLO             = $(TEST_DIR_BASE)/apollo-server
TEST_DIR_E2E                = $(TEST_DIR_BASE)/e2e
TEST_DIR_VISUAL             = $(TEST_DIR_BASE)/visual

LHCI                        = pnpm exec -- lhci autorun
LHCI_CONFIG_DESKTOP         = --config=./lighthouse/lighthouserc.desktop.js
LHCI_CONFIG_MOBILE          = --config=./lighthouse/lighthouserc.mobile.js
LHCI_FLAGS                  = --collect.url=$(LHCI_TARGET_URL)
LHCI_BUILD_CMD          	= make start-prod && $(LHCI)
LHCI_DESKTOP           		= $(LHCI_BUILD_CMD) $(LHCI_CONFIG_DESKTOP) $(LHCI_FLAGS)
LHCI_MOBILE            		= $(LHCI_BUILD_CMD) $(LHCI_CONFIG_MOBILE) $(LHCI_FLAGS)

DOCKER_COMPOSE_TEST_FILE    = -f docker-compose.test.yml
DOCKER_COMPOSE_DEV_FILE     = -f docker-compose.yml
COMMON_HEALTHCHECKS_FILE    = -f common-healthchecks.yml
EXEC_DEV_TTYLESS            = $(DOCKER_COMPOSE) exec -T dev

PLAYWRIGHT_DOCKER_CMD       = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) exec playwright
PLAYWRIGHT_TEST             = $(PLAYWRIGHT_DOCKER_CMD) sh -c

MEMLEAK_SERVICE             = memory-leak
DOCKER_COMPOSE_MEMLEAK_FILE = -f docker-compose.memory-leak.yml
MEMLEAK_BASE_PATH           = ./tests/memory-leak
MEMLEAK_RESULTS_DIR         = $(MEMLEAK_BASE_PATH)/results
MEMLEAK_TEST_SCRIPT         = $(MEMLEAK_BASE_PATH)/runMemlabTests.js

MEMLEAK_REMOVE_RESULTS		= rm -rf $(MEMLEAK_RESULTS_DIR)
MEMLEAK_SETUP 				= \
								echo "🧪 Starting memory leak test environment..."; \
								$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) up -d
MEMLEAK_RUN_TESTS			= \
								echo "🚀 Running memory leak tests..."; \
								$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) exec -T $(MEMLEAK_SERVICE) node $(MEMLEAK_TEST_SCRIPT) || exit 1
MEMLEAK_RUN_CLEANUP			= \
								echo "🧹 Cleaning up memory leak test containers..."; \
								$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) down --remove-orphans

K6_TEST_SCRIPT              ?= /loadTests/homepage.js
K6_RESULTS_FILE             ?= /loadTests/results/homepage.html
K6                          = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) --profile load run --rm k6
LOAD_TESTS_RUN              = $(K6) run --summary-trend-stats="avg,min,med,max,p(95),p(99)" --out "web-dashboard=period=1s&export=$(K6_RESULTS_FILE)" $(K6_TEST_SCRIPT)

UI_FLAGS                    = --ui-port=$(PLAYWRIGHT_TEST_PORT) --ui-host=$(UI_HOST)
UI_MODE_URL                 = http://$(WEBSITE_DOMAIN):$(PLAYWRIGHT_TEST_PORT)

MD_LINT_ARGS                = -i CHANGELOG.md -i "test-results/**/*.md" -i "playwright-report/data/**/*.md" "**/*.md"
PRETTIER_CMD                = pnpm exec -- prettier "**/*.{js,jsx,ts,tsx,mts,json,css,scss,md}" --write --ignore-path .prettierignore

JEST_FLAGS                  = --maxWorkers=2 --logHeapUsage

NETWORK_NAME                = website-network

CI                          ?= 0


ifeq ($(CI), 1)
    EXEC_CMD                =
    PNPM_EXEC               = pnpm
    DEV_CMD                 = $(BIN_DIR)/craco start
    BUILD_CMD               = $(CRACO_BUILD)

	STRYKER_CMD             = pnpm stryker run
    UNIT_TESTS              = env

    STORYBOOK_BUILD 		= pnpm exec -- storybook build
    STORYBOOK_START         = $(STORYBOOK_CMD)

    MARKDOWNLINT_BIN        = pnpm exec -- markdownlint
	LHCI_TARGET_URL 		= $(WEBSITE_URL)
    RUN_MEMLAB				= $(MEMLEAK_REMOVE_RESULTS) && node $(MEMLEAK_TEST_SCRIPT)
else
    EXEC_CMD                = $(EXEC_DEV_TTYLESS)
    PNPM_EXEC               = $(EXEC_DEV_TTYLESS) pnpm
    DEV_CMD                 = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d dev && make wait-for-dev
    BUILD_CMD               = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) run --rm dev $(CRACO_BUILD)

    STRYKER_CMD             = make start && $(EXEC_DEV_TTYLESS) pnpm stryker run
    UNIT_TESTS              = make start && $(EXEC_DEV_TTYLESS) env

    STORYBOOK_BUILD			= $(EXEC_DEV_TTYLESS) pnpm exec -- storybook build
    STORYBOOK_START         = $(EXEC_DEV_TTYLESS) $(STORYBOOK_CMD) --host 0.0.0.0 --no-open

    MARKDOWNLINT_BIN        = $(EXEC_DEV_TTYLESS) pnpm exec -- markdownlint
    LHCI_TARGET_URL             ?= $(REACT_APP_PROD_HOST_API_URL)
    RUN_MEMLAB				= \
    							$(MEMLEAK_REMOVE_RESULTS); \
                              	$(MEMLEAK_SETUP); \
                              	$(MEMLEAK_RUN_TESTS); \
                              	$(MEMLEAK_RUN_CLEANUP)
endif

# To Run in CI mode specify CI variable. Example: make lint-md CI=1

.DEFAULT_GOAL               = help
# .RECIPEPREFIX not overridden; keep default TAB
.PHONY: $(filter-out node_modules,$(MAKECMDGOALS)) lint
.PHONY: clean lint
.PHONY: storybook
.PHONY: all test
all: help
test: test-unit-all

RUN_VISUAL                  = $(PLAYWRIGHT_TEST) "$(PLAYWRIGHT_BIN) test $(TEST_DIR_VISUAL)"
RUN_E2E                     = $(PLAYWRIGHT_TEST) "$(PLAYWRIGHT_BIN) test $(TEST_DIR_E2E)"
PLAYWRIGHT_TEST_CMD             = $(PLAYWRIGHT_DOCKER_CMD) $(PLAYWRIGHT_BIN) test


help:
	@printf "\033[33mUsage:\033[0m make [target] [arg=\"val\"...]\n"
	@printf "\033[33mTargets:\033[0m\n"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Start the application
	$(DEV_CMD)

wait-for-dev: ## Wait for the dev service to be ready on port $(DEV_PORT).
	@echo "Waiting for dev service to be ready on port $(DEV_PORT)..."
	@i=0; \
	while [ $$i -lt 60 ]; do \
	  if $(PNPM_EXEC) exec -- wait-on http://$(WEBSITE_DOMAIN):$(DEV_PORT) > /dev/null 2>&1; then \
	    printf '\n✅ Dev service is up and running!\n'; \
	    exit 0; \
	  fi; \
	  printf "."; \
	  sleep 2; \
	  i=$$((i+1)); \
	done; \
	printf '\n❌ Timed out waiting for dev service\n'; \
	exit 1

build: ## Build the dev container
	$(BUILD_CMD)

build-analyze: ## Build production bundle and launch bundle-analyzer report (ANALYZE=true)
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) run --rm -e ANALYZE=true dev $(CRACO_BUILD)

build-out: ## Build production artifacts to ./build directory (via Docker)
	@echo "🏗️ Building production Docker image for Craco..."
	docker build -t craco-build -f Dockerfile --target production .
	@container_id=$$(docker create craco-build) && \
	rm -rf ./build && \
	docker cp $$container_id:/app/build ./ && \
	docker rm $$container_id && \
	echo "✅ Build artifacts extracted to ./build directory"

format: ## This command executes Prettier formatting
	$(EXEC_CMD) $(PRETTIER_CMD)

lint-eslint: ## This command executes ESLint
	$(EXEC_CMD) npx eslint .

lint-tsc: ## This command executes Typescript linter
	$(PNPM_EXEC) tsc

lint-md: ## This command executes Markdown linter
	$(MARKDOWNLINT_BIN) $(MD_LINT_ARGS)

lint: lint-eslint lint-tsc lint-md ## Runs all linters: ESLint, TypeScript, and Markdown linters in sequence.

husky: ## One-time Husky setup to enable Git hooks (deprecated if already set)
	pnpm husky install

storybook-start: ## Start Storybook UI and open in browser
	$(STORYBOOK_START)

storybook-build: ## Build Storybook UI.
	$(STORYBOOK_BUILD)

test-e2e: start-prod  ## Start production and run E2E tests (Playwright)
	$(RUN_E2E)

test-e2e-ui: start-prod ## Start the production environment and run E2E tests with the UI available at $(UI_MODE_URL)
	@echo "🚀 Starting Playwright UI tests..."
	@echo "Test will be run on: $(UI_MODE_URL)"
	$(PLAYWRIGHT_TEST_CMD) $(TEST_DIR_E2E) $(UI_FLAGS)

test-visual: start-prod  ## Start production and run visual tests (Playwright)
	$(RUN_VISUAL)

test-visual-ui: start-prod ## Start the production environment and run visual tests with the UI available at $(UI_MODE_URL)
	@echo "🚀 Starting Playwright UI tests..."
	@echo "Test will be run on: $(UI_MODE_URL)"
	$(PLAYWRIGHT_TEST_CMD) $(TEST_DIR_VISUAL) $(UI_FLAGS)

test-visual-update: start-prod ## Update Playwright visual snapshots
	$(PLAYWRIGHT_TEST_CMD) $(TEST_DIR_VISUAL) --update-snapshots

create-network: ## Create the external Docker network if it doesn't exist
	@docker network ls | grep -wq $(NETWORK_NAME) || docker network create $(NETWORK_NAME)

start-prod: create-network ## Build image and start container in production mode
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) $(COMMON_HEALTHCHECKS_FILE) up -d --no-recreate && make wait-for-prod-health

wait-for-prod:
	@echo "Waiting for prod service on port $(PROD_PORT)..."
	@for i in $$(seq 1 60); do \
		pnpm exec -- wait-on http://$(WEBSITE_DOMAIN):$(PROD_PORT) > /dev/null 2>&1 && break; \
		printf "."; sleep 2; \
		[ $$i -eq 60 ] && echo "❌ Timed out waiting for prod service" && exit 1; \
	done; \
	printf '\n✅ Prod service is up and running!\n'

test-unit-all: test-unit-client test-unit-server ## This command executes unit tests for both client and server environments.

test-unit-client: ## Run all client-side unit tests using Jest (TEST_ENV=client)
	$(UNIT_TESTS) TEST_ENV=client $(JEST_BIN) $(JEST_FLAGS)

test-unit-server: ## Run server-side unit tests for Apollo using Jest (Node.js env, TEST_ENV=server, target: $(TEST_DIR_APOLLO))
	$(UNIT_TESTS) TEST_ENV=server $(JEST_BIN) $(JEST_FLAGS) $(TEST_DIR_APOLLO)

test-memory-leak: start-prod ## This command executes memory leaks tests using Memlab library.
	$(RUN_MEMLAB)

test-mutation: ## Run mutation tests using Stryker after building the app
	$(STRYKER_CMD)

wait-for-prod-health: ## Wait for the prod container to reach a healthy state.
	@echo "Waiting for prod container to become healthy (timeout: 60s)..."
	@for i in $$(seq 1 30); do \
		cid=$$($(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) ps -q prod); \
		if [ -n "$$cid" ]; then \
			status=$$(docker inspect --format='{{.State.Health.Status}}' $$cid 2>/dev/null || echo "starting"); \
			if [ "$$status" = "healthy" ]; then \
				echo "✅ Prod container is healthy and ready!"; \
				exit 0; \
			fi; \
			echo "⏳ Status: $$status"; \
		else \
			echo "⏳ Waiting for container to start..."; \
		fi; \
		sleep 2; \
	done; \
	echo "❌ Timed out waiting for prod container to become healthy"; \
	exit 1


prepare-results-dir:
	mkdir -p ./tests/load/results

test-load: start-prod wait-for-prod-health prepare-results-dir ## This command executes load tests using K6 library. Note: The target host is determined by the service URL
                       ## using $(PROD_PORT), which maps to the production service in Docker Compose.
	$(LOAD_TESTS_RUN)

lighthouse-desktop: ## Run a Lighthouse audit using desktop viewport settings to evaluate performance and best practices
	$(LHCI_DESKTOP)

lighthouse-mobile: ## Run a Lighthouse audit using mobile viewport settings to evaluate mobile UX and performance
	$(LHCI_MOBILE)

install: ## Install node modules using pnpm (CI=1 runs locally, default runs in container) — uses frozen lockfile and affects node_modules via volumes
	$(PNPM_EXEC) install --frozen-lockfile
	make husky

update: ## Update node modules to latest allowed versions — always runs locally, updates lockfile (run before committing dependency changes)
	pnpm update

down: ## Stop the docker containers
	$(DOCKER_COMPOSE) down --remove-orphans

sh: ## Open a shell in the dev container
	$(DOCKER_COMPOSE) exec dev sh

ps: ## Show Docker Compose services status
	@$(DOCKER_COMPOSE) ps

logs: ## Show all logs
	@$(DOCKER_COMPOSE) logs --follow dev

new-logs: ## Show live logs of the dev container
	@$(DOCKER_COMPOSE) logs --tail=0 --follow dev

logs-prod: ## Show all logs
	@$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) logs --follow prod

stop: ## Stop docker
	$(DOCKER_COMPOSE) stop

check-node-version: ## Check if the correct Node.js version is installed
	$(EXEC_CMD) pnpm exec -- node checkNodeVersion.js

clean: down ## Clean up only this project's containers, images, and volumes
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) down --volumes --remove-orphans --rmi local
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) down --volumes --remove-orphans --rmi local

