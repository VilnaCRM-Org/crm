[![SWUbanner](./public/supportUkraine.svg)](https://supportukrainenow.org/)

# Template for modern SPA applications

[![CodeScene Code Health](https://codescene.io/projects/43862/status-badges/code-health)](https://codescene.io/projects/43862)
[![CodeScene System Mastery](https://codescene.io/projects/43862/status-badges/system-mastery)](https://codescene.io/projects/43862)
[![codecov](https://codecov.io/gh/VilnaCRM-Org/frontend-spa-template/graph/badge.svg?token=iV60KVUVxQ)](https://codecov.io/gh/VilnaCRM-Org/frontend-spa-template)

## Possibilities

- Modern JavaScript stack for services: [React](https://react.dev/)
- A lot of CI checks to ensure the highest code quality that can be
  (Security checks, Code style fixer, static linters, DeepScan, Snyk)
- Configured testing tools: [Playwright](https://playwright.dev/), [Jest](https://jestjs.io/)
- This template is based on [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master)
- Much more!

## Why you might need it

Many front-end developers need to create new projects from scratch and spend a lot of time.

We decided to simplify this exhausting process and create a public template for modern
front-end applications. This template is used for all our microservices in VilnaCRM.

## License

This software is distributed under the
[Creative Commons Zero v1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/deed) license.
Please read [LICENSE](https://github.com/VilnaCRM-Org/frontend-spa-template/blob/main/LICENSE) for information
on the software availability and distribution.

### 🚀 Minimal Installation Guide

#### 1. Clone the Repository

Clone locally or use GitHub’s `Use this template` feature.

#### 2. Install Prerequisites

Before running the application, make sure the following tools are installed on your machine:

- **[Node.js](https://nodejs.org/en/)** (version 20 or higher).
  You can download and install Node.js from the official website, or use a version manager like
  nvm [Node Version Manager](https://github.com/nvm-sh/nvm) to easily manage versions.

- **[Docker](https://docs.docker.com/engine/install/)** required for containerization and managing
  isolated environments. Install Docker according to the instructions
  for your operating system. Follow the guide to ensure Docker is properly
  configured and running on your machine.

- **[Docker Compose](https://docs.docker.com/compose/install/)** is needed to manage multi-container
  Docker applications. Docker Compose is essential for starting up the
  development environment and running the services defined in docker-compose.yml.

- **[pnpm](https://pnpm.io/)** a fast, disk space-efficient package manager for JavaScript and
  Node.js projects. It uses a unique content-addressable storage to save dependencies on your machine
  only once, and creates hard links to them in project folders, resulting in faster installations and
  smaller disk usage compared to npm or yarn.

#### 3. Run the Application

After installing all prerequisites, you can start the application inside a Docker container:

```bash
   make start
```

**What Happens When You Run `make start`**:

The command will:

- Build and start the project inside a Docker container named `dev`.
- Install all the necessary dependencies (including Node.js dependencies) inside the container.
- The application will be up and running.

Access the application at <http://localhost:3000>.

## Project Commands

To view all available commands, run `make help`:

```bash
  make help
```

The following commands are available when the project is installed locally.

General

```bash
  make start: starts the application
  make build: builds the application
  make format: formats the codebase to ensure consistent style across all files
  make update: updates node modules according to the current package.json file
  make install: installs node modules according to the current pnpm-lock.yaml file
  make check-node-version: checks if the correct Node.js version is installed
```

Linting & Formatting

```bash
  make lint-eslint: lints the codebase using eslint rules
  make lint-tsc: runs static type checking with TypeScript
  make lint-md: lints all markdown files (excluding CHANGELOG.md) using markdownlint
```

Testing

```bash
  make test-unit-all: runs unit tests for both client and server environments
  make test-unit-client: runs unit tests for the client using Jest
  make test-unit-server: runs unit tests for the server using Jest
  make test-memory-leak: runs memory leak tests using Memlab
  make load-tests: executes load tests using the K6 library
```

Runs tests inside the Playwright container, targeting the production container:

```bash
  make test-e2e: full end-to-end tests
  make test-e2e-ui: runs UI-specific end-to-end tests
  make test-visual: runs general visual regression tests
  make test-visual-ui: runs UI-focused visual regression tests
```

### Important Note About Swagger E2E Tests

For Swagger E2E tests, the application uses Mockoon to handle API requests.
The API endpoints from the Swagger schema are automatically rewritten during
both production and development container builds. This means that all API requests
are currently directed to Mockoon instead of a real backend. Please keep
this in mind if you plan to integrate with a real backend service in
the future—you'll need to update the API configuration accordingly.

To run tests locally, the Mockoon mock server is automatically started via
`make test-e2e`. For manual setup, see the Mockoon configuration in
`docker-compose.test.yml`.

Lighthouse

```bash
  make lighthouse-desktop: runs Lighthouse audits in desktop mode
  make lighthouse-mobile: runs Lighthouse audits in mobile mode
```

Git

```bash
  make husky: sets up Husky (Git hooks manager) — run once after cloning the repo
```

Storybook

```bash
  make storybook-start: starts Storybook UI targeting the dev container
  make storybook-build: builds Storybook targeting the dev container
```

Docker

```bash
  make down: stops the Docker containers and removes orphaned containers
  make stop: stops dev container
  make start-prod: builds image and starts the prod container (production mode)
  make ps: displays currently running Docker containers with their details
  make sh: starts a terminal inside the dev Docker container for manual commands
  make logs: shows all logs of dev container
  make logs-prod: shows all logs of prd container
  make new-logs: shows live logs of the dev container
  make wait-for-dev: waits for the dev service to be ready on port 3000
  make wait-for-prod: waits for the prod service to be ready on port 3001
```

Note: The following commands do not require the `CI=1` prefix:

```bash
  make test-e2e: starts production and runs end-to-end tests inside the prod container
  make test-visual: runs visual tests inside the prod container
  make test-e2e-ui: runs end-to-end tests with UI inside the prod container
  make test-visual-ui: runs visual tests with UI inside the prod container

  make load-tests: executes load tests using the K6 library
  (uses "prod" as hostname, which maps to the Docker service)

  make git-hooks-install: installs husky Git hooks locally
  make update: runs locally on the host machine, not in a container
```

💡 Tip: To run commands locally without Docker, please prefix command with CI=1.
Example:

```bash
  CI=1 make start
```

### Load Testing with K6

This project includes a dedicated load testing service using K6, configured via a Docker Compose profile.

#### What are Docker Compose Profiles?

Docker Compose profiles let you selectively start groups of services. The load testing service is tagged
with the `load` profile in `docker-compose.test.yml`, so it only runs when you explicitly include
that profile.

#### Running Load Tests

Using the `make` command (recommended):

```bash
  make load-tests
```

The load testing service waits for the production service to become healthy before starting.
Test results will be streamed to the K6 web dashboard and saved under ./test/load/results/.

Available Load Test Scenarios:

- smoke: a quick health check with a small number of virtual users.
- average: simulates a typical daily traffic load.
- stress: pushes the system to its limits to identify breaking points.
- spike: sudden ramp-up of virtual users to test burst handling.

Adjust scenarios and thresholds in ./test/load/config.json.dist as needed.

## Routing

This project includes a routing script for managing URLs.
The routing script maps requests to the correct HTML files, ensuring proper navigation.
For detailed information, check the [routing script](scripts/cloudfront_routing.js).

### How It Works

- Mapping: Specific URL paths are mapped to corresponding HTML files.
- Fallback Logic: For undefined routes, the script appends /index.html to handle directory-like paths.
- Error Handling: If an error occurs, the script logs it and returns the original request.

This routing logic is useful for SSR (Server-Side Rendered) applications,
particularly when hosted on platforms like AWS CloudFront.

## Documentation

Start reading at the [GitHub wiki](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki).
If you're having trouble, head for
[the troubleshooting guide](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki/Troubleshooting)
as it's frequently updated.

You can generate complete API-level documentation by running `doc` in the top-level
folder, and documentation will appear in the `docs` folder, though you'll need to have
[API-Extractor](https://api-extractor.com/) installed.

If the documentation doesn't cover what you need, search the
[many questions on Stack Overflow](http://stackoverflow.com/questions/tagged/vilnacrm),
and before you ask a question,
[read the troubleshooting guide](https://github.com/VilnaCRM-Org/frontend-spa-template/wiki/Troubleshooting).

## Tests

[Tests](https://github.com/VilnaCRM-Org/frontend-spa-template/actions)

If this isn't passing, is there something you can do to help?

## Security

Please disclose any vulnerabilities found responsibly – report security issues to the maintainers privately.

See
[SECURITY](https://github.com/VilnaCRM-Org/frontend-spa-template/tree/main/SECURITY.md)
and
[Security advisories on GitHub](https://github.com/VilnaCRM-Org/frontend-spa-template/security).

## Contributing

Please submit bug reports, suggestions, and pull requests to the
[GitHub issue tracker](https://github.com/VilnaCRM-Org/frontend-spa-template/issues).

We're particularly interested in fixing edge cases, expanding test coverage,
and updating translations.

If you found a mistake in the docs, or want to add something, go ahead and
amend the wiki – anyone can edit it.

## Sponsorship

Development time and resources for this repository are provided by
[VilnaCRM](https://vilnacrm.com/),
the free and opensource CRM system.

Donations are very welcome, whether in beer 🍺, T-shirts 👕, or cold, hard cash 💰.
Sponsorship through GitHub is a simple and convenient way to say "thank you" to
maintainers and contributors – just click the "Sponsor" button
[on the project page](https://github.com/VilnaCRM-Org/frontend-spa-template).
If your company uses this template, consider taking part in the VilnaCRM's enterprise support program.

## Changelog

See [changelog](CHANGELOG.md).
