include .env
-include .env.local
-include .env.production
-include .env.production.local
-include .env.development
-include .env.development.local
-include .env.ci

export

DOCKER_COMPOSE              = docker compose

BIN_DIR                     = ./node_modules/.bin
IMG_OPTIMIZE                = $(BIN_DIR)/next-export-optimize-images
STORYBOOK_BIN               = $(BIN_DIR)/storybook
JEST_BIN                    = $(BIN_DIR)/jest
SERVE_BIN                   = $(BIN_DIR)/serve
PLAYWRIGHT_BIN              = $(BIN_DIR)/playwright

CRACO_BUILD                 = pnpm craco build
STORYBOOK_BUILD_CMD         = $(STORYBOOK_BIN) build

TEST_DIR_BASE               = ./src/test
TEST_DIR_APOLLO             = $(TEST_DIR_BASE)/apollo-server
TEST_DIR_E2E                = $(TEST_DIR_BASE)/e2e
TEST_DIR_VISUAL             = $(TEST_DIR_BASE)/visual

STRYKER_CMD                 = pnpm stryker run

SERVE_CMD                   = --collect.startServerCommand="$(SERVE_BIN) out"
LHCI                        = pnpm lhci autorun
LHCI_CONFIG_DESKTOP         = --config=lighthouserc.desktop.js
LHCI_CONFIG_MOBILE          = --config=lighthouserc.mobile.js
LHCI_DESKTOP_SERVE          = $(LHCI_CONFIG_DESKTOP) $(SERVE_CMD)
LHCI_MOBILE_SERVE           = $(LHCI_CONFIG_MOBILE) $(SERVE_CMD)

DOCKER_COMPOSE_TEST_FILE    = -f docker-compose.test.yml
DOCKER_COMPOSE_DEV_FILE     = -f docker-compose.yml
COMMON_HEALTHCHECKS_FILE    = -f common-healthchecks.yml
EXEC_DEV_TTYLESS            = $(DOCKER_COMPOSE) exec -T dev

PLAYWRIGHT_DOCKER_CMD       = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) exec playwright
PLAYWRIGHT_TEST             = $(PLAYWRIGHT_DOCKER_CMD) sh -c

MEMLEAK_SERVICE             = memory-leak
DOCKER_COMPOSE_MEMLEAK_FILE = -f docker-compose.memory-leak.yml
MEMLEAK_BASE_PATH           = ./memlab
MEMLEAK_RESULTS_DIR         = $(MEMLEAK_BASE_PATH)/results
MEMLEAK_TEST_SCRIPT         = $(MEMLEAK_BASE_PATH)/runMemlabTests.js

K6_TEST_SCRIPT              ?= /loadTests/homepage.js
K6_RESULTS_FILE             ?= /loadTests/results/homepage.html
K6_SWAGGER_TEST_SCRIPT      ?= /loadTests/swagger.js
K6_SWAGGER_RESULTS_FILE     ?= /loadTests/results/swagger.html
K6                          = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) --profile load run --rm k6
LOAD_TESTS_RUN              = $(K6) run --summary-trend-stats="avg,min,med,max,p(95),p(99)" --out "web-dashboard=period=1s&export=$(K6_RESULTS_FILE)" $(K6_TEST_SCRIPT)
LOAD_TESTS_RUN_SWAGGER      = $(K6) run --summary-trend-stats="avg,min,med,max,p(95),p(99)" --out "web-dashboard=period=1s&export=$(K6_SWAGGER_RESULTS_FILE)" $(K6_SWAGGER_TEST_SCRIPT)

UI_FLAGS                    = --ui-port=$(PLAYWRIGHT_TEST_PORT) --ui-host=$(UI_HOST)
UI_MODE_URL                 = http://$(WEBSITE_DOMAIN):$(PLAYWRIGHT_TEST_PORT)

MD_LINT_ARGS                = -i CHANGELOG.md -i "test-results/**/*.md" -i "playwright-report/data/**/*.md" "**/*.md"
PRETTIER_CMD                = pnpm prettier "**/*.{js,jsx,ts,tsx,mts,json,css,scss,md}" --write --ignore-path .prettierignore

JEST_FLAGS                  = --verbose

NETWORK_NAME                = website-network

CI                          ?= 0


ifeq ($(CI), 1)
    EXEC_CMD                =
    PNPM_EXEC               = pnpm
    DEV_CMD                 = craco start
    BUILD_CMD               = $(CRACO_BUILD)

    UNIT_TESTS              = env

    STORYBOOK_START         = $(STORYBOOK_BIN) dev -p $(STORYBOOK_PORT)

    LHCI_BUILD_CMD          = $(NEXT_BUILD_CMD) && $(LHCI)
    LHCI_DESKTOP            = $(LHCI_BUILD_CMD) $(LHCI_DESKTOP_SERVE)
    LHCI_MOBILE             = $(LHCI_BUILD_CMD) $(LHCI_MOBILE_SERVE)

    MARKDOWNLINT_BIN        = npx markdownlint
else
    EXEC_CMD                = $(EXEC_DEV_TTYLESS)
    PNPM_EXEC               = $(EXEC_DEV_TTYLESS) pnpm
    DEV_CMD                 = $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_DEV_FILE) up -d dev && make wait-for-dev
    BUILD_CMD               = docker compose run --rm dev $(CRACO_BUILD)

    STRYKER_CMD             = make start && $(EXEC_DEV_TTYLESS) pnpm stryker run
    UNIT_TESTS              = make start && $(EXEC_DEV_TTYLESS) env

    STORYBOOK_START         = $(STORYBOOK_BIN) dev -p $(STORYBOOK_PORT) --host 0.0.0.0

    LHCI_BUILD_CMD          = make start-prod && $(LHCI)
    LHCI_DESKTOP            = $(LHCI_BUILD_CMD) $(LHCI_CONFIG_DESKTOP)
    LHCI_MOBILE             = $(LHCI_BUILD_CMD) $(LHCI_CONFIG_MOBILE)


    MARKDOWNLINT_BIN        = $(EXEC_DEV_TTYLESS) npx markdownlint
endif

# To Run in CI mode specify CI variable. Example: make lint-md CI=1

.DEFAULT_GOAL               = help
.RECIPEPREFIX               +=
.PHONY: $(filter-out node_modules,$(MAKECMDGOALS)) lint
.PHONY: all clean test lint

run-visual                  = $(PLAYWRIGHT_TEST) "$(PLAYWRIGHT_BIN) test $(TEST_DIR_VISUAL)"
run-e2e                     = $(PLAYWRIGHT_TEST) "$(PLAYWRIGHT_BIN) test $(TEST_DIR_E2E)"
playwright-test             = $(PLAYWRIGHT_DOCKER_CMD) $(PLAYWRIGHT_BIN) test

help:
	@printf "\033[33mUsage:\033[0m make [target] [arg=\"val\"...]\n"
	@printf "\033[33mTargets:\033[0m\n"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Start the application
	$(DEV_CMD)

wait-for-dev: ## Wait for the dev service to be ready on port $(DEV_PORT).
	@echo "Waiting for dev service to be ready on port $(DEV_PORT)..."
	@for i in $(seq 1 60); do \
      npx wait-on http://$(WEBSITE_DOMAIN):$(DEV_PORT) 2>/dev/null && break; \
      printf "."; sleep 2; \
      [ $$i -eq 60 ] && echo "❌ Timed out waiting for dev service" && exit 1; \
    done
	@printf '\nDev service is up and running!\n'

build: ## Build the dev container
	$(DOCKER_COMPOSE) build

all: ## Fully build the project using Craco
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
	$(MARKDOWNLINT_BIN) $(MD_LINT_ARGS) "**/*.md"

lint: lint-eslint lint-tsc lint-md ## Runs all linters: ESLint, TypeScript, and Markdown linters in sequence.

husky: ## One-time Husky setup to enable Git hooks (deprecated if already set)
	pnpm husky install

storybook-start: ## Start Storybook UI and open in browser
	$(PNPM_EXEC) $(STORYBOOK_START)

storybook-build: ## Build Storybook UI.
	$(PNPM_EXEC) $(STORYBOOK_BUILD_CMD)

test-e2e: start-prod  ## Start production and run E2E tests (Playwright)
	$(run-e2e)

test-e2e-ui: start-prod ## Start the production environment and run E2E tests with the UI available at $(UI_MODE_URL)
	@echo "🚀 Starting Playwright UI tests..."
	@echo "Test will be run on: $(UI_MODE_URL)"
	$(playwright-test) $(TEST_DIR_E2E) $(UI_FLAGS)

test-visual: start-prod  ## Start production and run visual tests (Playwright)
	$(run-visual)

test-visual-ui: start-prod ## Start the production environment and run visual tests with the UI available at $(UI_MODE_URL)
	@echo "🚀 Starting Playwright UI tests..."
	@echo "Test will be run on: $(UI_MODE_URL)"
	$(playwright-test) $(TEST_DIR_VISUAL) $(UI_FLAGS)

test-visual-update: start-prod ## Update Playwright visual snapshots
	$(playwright-test) $(TEST_DIR_VISUAL) --update-snapshots

create-network: ## Create the external Docker network if it doesn't exist
	@docker network ls | grep -q $(NETWORK_NAME) || docker network create $(NETWORK_NAME)

start-prod: create-network ## Build image and start container in production mode
	$(DOCKER_COMPOSE) $(COMMON_HEALTHCHECKS_FILE) $(DOCKER_COMPOSE_TEST_FILE) up -d && make wait-for-prod

wait-for-prod: ## Wait for the prod service to be ready on port $(PROD_PORT).
	@echo "Waiting for prod service to be ready on port $(PROD_PORT)..."
	@for i in $(seq 1 60); do \
      npx wait-on http://$(WEBSITE_DOMAIN):$(PROD_PORT) 2>/dev/null && break; \
      printf "."; sleep 2; \
      [ $$i -eq 60 ] && echo "❌ Timed out waiting for prod service" && exit 1; \
    done
	@printf '\nProd service is up and running!\n'

test-unit-all: test-unit-client test-unit-server ## This command executes unit tests for both client and server environments.

test-unit-client: ## Run all client-side unit tests using Jest (Next.js env, TEST_ENV=client)
	$(UNIT_TESTS) TEST_ENV=client $(JEST_BIN) $(JEST_FLAGS)

test-unit-server: ## Run server-side unit tests for Apollo using Jest (Node.js env, TEST_ENV=server, target: $(TEST_DIR_APOLLO))
	$(UNIT_TESTS) TEST_ENV=server $(JEST_BIN) $(JEST_FLAGS) $(TEST_DIR_APOLLO)

test-memory-leak: start-prod ## This command executes memory leaks tests using Memlab library.
	@echo "🧪 Starting memory leak test environment..."
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) up -d
	@echo "🧹 Cleaning up previous memory leak results..."
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) exec -T $(MEMLEAK_SERVICE) rm -rf $(MEMLEAK_RESULTS_DIR)
	@echo "🚀 Running memory leak tests..."
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) exec -T $(MEMLEAK_SERVICE) node $(MEMLEAK_TEST_SCRIPT)
	@echo "🧹 Cleaning up memory leak test containers..."
	$(DOCKER_COMPOSE) $(DOCKER_COMPOSE_MEMLEAK_FILE) down --remove-orphans

test-mutation: build ## Run mutation tests using Stryker after building the app
	$(STRYKER_CMD)

wait-for-prod-health: ## Wait for the prod container to reach a healthy state.
	@echo "Waiting for prod container to become healthy (timeout: 60s)..."
	@for i in $$(seq 1 30); do \
		if $(DOCKER_COMPOSE) $(DOCKER_COMPOSE_TEST_FILE) ps | grep -q "prod.*(healthy)"; then \
			echo "Prod container is healthy and ready!"; \
			break; \
		fi; \
		sleep 2; \
		if [ $$i -eq 30 ]; then \
			echo "❌ Timed out waiting for prod container to become healthy"; \
			exit 1; \
		fi; \
	done

load-tests: start-prod wait-for-prod-health ## This command executes load tests using K6 library. Note: The target host is determined by the service URL
                       ## using $(NEXT_PUBLIC_PROD_PORT), which maps to the production service in Docker Compose.
	$(LOAD_TESTS_RUN)

load-tests-swagger: start-prod wait-for-prod-health ## Execute comprehensive load tests for the Swagger page. Use environment variables to run specific scenarios:
                       ## run_smoke=true, run_average=true, run_stress=true, run_spike=true. If none set, runs all scenarios.
	$(LOAD_TESTS_RUN_SWAGGER)

lighthouse-desktop: ## Run a Lighthouse audit using desktop viewport settings to evaluate performance and best practices
	$(LHCI_DESKTOP)

lighthouse-mobile: ## Run a Lighthouse audit using mobile viewport settings to evaluate mobile UX and performance
	$(LHCI_MOBILE)

install: ## Install node modules using pnpm (CI=1 runs locally, default runs in container) — uses frozen lockfile and affects node_modules via volumes
	$(PNPM_EXEC) install --frozen-lockfile

update: ## Update node modules to latest allowed versions — always runs locally, updates lockfile (run before committing dependency changes)
	pnpm update

down: ## Stop the docker containers
	$(DOCKER_COMPOSE) down --remove-orphans

sh: ## Log to the docker container
	$(DOCKER_COMPOSE) exec dev sh

ps: ## Log to the docker container
	@$(DOCKER_COMPOSE) ps

logs: ## Show all logs
	@$(DOCKER_COMPOSE) logs --follow dev

new-logs: ## Show live logs of the dev container
	@$(DOCKER_COMPOSE) logs --tail=0 --follow dev

logs-prod: ## Show all logs
	@$(DOCKER_COMPOSE) -f docker-compose.test.yml logs --follow prod

stop: ## Stop docker
	$(DOCKER_COMPOSE) stop

check-node-version: ## Check if the correct Node.js version is installed
	$(PNPM_EXEC) node checkNodeVersion.js

clean: down ## Clean up containers and artifacts
	docker system prune -f
# ******

# Executables: local only
# PNPM_BIN    		    = pnpm
#
# # Executables
# EXEC_NODEJS	= $(DOCKER_COMPOSE) exec nodejs
# PNPM      	= $(EXEC_NODEJS) pnpm
# PNPM_RUN    = $(PNPM_RUN) run
#
# git-hooks-install: ## Install git hooks
# 	$(PNPM_RUN) prepare
#
# storybook-start: ## Start Storybook UI. Storybook is a frontend workshop for building UI components and pages in isolation.
# 	$(PNPM_RUN) storybook
#
# storybook-build: ## Build Storybook UI. Storybook is a frontend workshop for building UI components and pages in isolation.
# 	$(PNPM_RUN) build-storybook
#
# generate-ts-doc: ## This command generates documentation from the typescript files.
# 	$(PNPM_RUN) doc
#
# test-e2e: ## This command executes cypress tests.
# 	$(PNPM_RUN) test:e2e
#
# test-e2e-local: ## This command opens management UI for cypress tests.
# 	$(PNPM_RUN) test:e2e:local
#
# test-unit: ## This command executes unit tests using Jest library.
# 	$(PNPM_RUN) test:unit
#
# test-memory-leak: ## This command executes memory leaks tests using Memlab library.
# 	$(PNPM_RUN) test:memory-leak
#
# lighthouse-desktop: ## This command executes lighthouse tests for desktop.
# 	$(PNPM_RUN) lighthouse:desktop
#
# lighthouse-mobile: ## This command executes lighthouse tests for mobile.
# 	$(PNPM_RUN) lighthouse:mobile
# up: ## Start the docker hub (Nodejs)
# 	$(DOCKER_COMPOSE) up -d
#
# build: ## Builds the images (Nodejs)
# 	$(DOCKER_COMPOSE) build --pull --no-cache
#
# down: ## Stop the docker hub
# 	$(DOCKER_COMPOSE) down --remove-orphans
#
# stop: ## Stop docker
# 	$(DOCKER_COMPOSE) stop
