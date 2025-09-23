# CRM Development Guidelines

This document provides essential information for developers working on this React/TypeScript CRM application.

## Prerequisites

- **Node.js**: >=20.0.0 (enforced by `engines` in package.json)
- **Package Manager**: pnpm >=9 (required, enforced by `engineStrict: true`)
- **Docker**: Required for containerized development environment
- **Docker Compose**: For orchestrating development services

## Build & Configuration Instructions

### Development Environment Setup

1. **Install Dependencies**:

   ```bash
   make install
   # Runs: pnpm install --frozen-lockfile (in container or locally based on CI flag)
   ```

2. **Start Development Server**:

   ```bash
   make start
   # Starts Docker container with hot reload on port 3000 and Storybook on port 6006
   ```

3. **Wait for Service Ready**:
   ```bash
   make wait-for-dev
   # Waits up to 60 seconds for dev service to be ready on port 3000
   ```

### Production Build

- **Standard Build**: `make build-out` - Builds production artifacts to `./build` directory
- **Bundle Analysis**: `make build-analyze` - Build with bundle analyzer (set `ANALYZE=true`)
- **Docker Production**: `make start-prod` - Start production container for testing

### Environment Variables

The project uses multiple environment files loaded via Makefile:

- `.env` - Base environment variables
- `.env.local` - Local overrides (not committed)
- `.env.development` / `.env.production` - Environment-specific configs
- `.env.ci` - CI-specific configurations

## Testing Information

### Test Structure

```
tests/
├── unit/                    # Unit tests (Jest + React Testing Library)
│   ├── components/         # Component tests
│   ├── utils/              # Utility function tests
│   └── test.test.ts       # Basic test example
├── e2e/                    # End-to-end tests (Playwright)
├── visual/                 # Visual regression tests (Playwright)
├── apollo-server/          # Server-side unit tests
├── memory-leak/            # Memory leak tests (Memlab)
└── load/                   # Load tests (K6)
```

### Running Tests

#### Unit Tests

```bash
# All unit tests (client + server)
make test-unit-all

# Client-side only (React components, utilities)
make test-unit-client

# Server-side only (Apollo GraphQL)
make test-unit-server
```

#### End-to-End Tests

```bash
# Run E2E tests
make test-e2e

# Run E2E tests with UI (available at http://localhost:PLAYWRIGHT_TEST_PORT)
make test-e2e-ui
```

#### Visual Regression Tests

```bash
# Run visual tests
make test-visual

# Update visual snapshots
make test-visual-update

# Run with UI
make test-visual-ui
```

#### Other Test Types

```bash
# Memory leak testing (Memlab)
make test-memory-leak

# Load testing (K6)
make test-load

# Mutation testing (Stryker)
make test-mutation
```

### Test Configuration Details

- **Jest Config**: Supports both `jsdom` (client) and `node` (server) environments via `TEST_ENV` variable
- **Path Mapping**: Uses `@/` alias for `src/` directory imports
- **Coverage**: Enabled by default with V8 provider
- **Playwright**: Tests 3 browsers (Chromium, Firefox, WebKit) with Docker-specific launch options

### Example Test Creation

**1. Create a utility function** (`src/utils/example.ts`):

```typescript
export const add = (a: number, b: number): number => a + b;
```

**2. Create corresponding test** (`tests/unit/utils/example.test.ts`):

```typescript
import { add } from '@/utils/example';

describe('example utils', () => {
  it('should add numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

**3. Run the test**:

```bash
make test-unit-client
```

## Code Quality & Development Standards

### Linting & Formatting

```bash
# Run all linters
make lint

# Individual linters
make lint-eslint    # ESLint with Airbnb + TypeScript rules
make lint-tsc       # TypeScript compiler checks
make lint-md        # Markdown linting

# Code formatting
make format         # Prettier formatting
```

### ESLint Configuration Highlights

- **Base**: Airbnb style guide with TypeScript extensions
- **Strict Rules**: Explicit return types, member accessibility, no `any` types
- **Import Ordering**: Alphabetical with grouped imports
- **Testing**: Specific rules for Testing Library and Jest DOM
- **Path Restrictions**: Prevents cross-feature imports (`@/features/*/*`)

### Git Hooks & Commit Standards

- **Husky**: Git hooks setup with `make husky`
- **Commitlint**: Conventional commit format enforced
- **Pre-commit**: Runs linting and formatting checks

## Architecture & Technology Stack

### Core Technologies

- **Frontend**: React 18.3.1 with TypeScript
- **State Management**: Redux Toolkit + React Redux
- **Styling**: Material-UI (MUI) v7 with Emotion
- **GraphQL**: Apollo Client v3 with Apollo Server v4
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next + react-i18next

### Development Tools

- **Build Tool**: Craco (Create React App Configuration Override)
- **Package Manager**: pnpm (required)
- **Containerization**: Docker with Docker Compose
- **Documentation**: Storybook v9
- **Monitoring**: Sentry for error tracking

### Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Playwright (multi-browser)
- **Visual Testing**: Playwright visual comparisons
- **Memory Testing**: Memlab
- **Load Testing**: K6
- **Mutation Testing**: Stryker
- **Performance**: Lighthouse CI (desktop + mobile)

## Development Workflow Best Practices

### 1. Starting Development

```bash
# Check Node version first
make check-node-version

# Install dependencies and start
make install
make start
```

### 2. Code Quality Checks

```bash
# Before committing
make lint
make format
make test-unit-all
```

### 3. Adding New Features

- Place components in appropriate feature directories under `src/`
- Use `@/` alias for imports from `src/`
- Follow TypeScript strict mode requirements
- Add comprehensive unit tests
- Update Storybook stories if applicable

### 4. Docker Commands

```bash
make sh           # Access container shell
make logs         # View development logs
make ps           # View container status
make down         # Stop containers
make clean        # Full cleanup (containers, images, volumes)
```

### 5. Dependency Management

```bash
make update       # Update dependencies (runs locally, updates lockfile)
```

## Performance & Quality Monitoring

### Lighthouse Audits

```bash
make lighthouse-desktop    # Desktop performance audit
make lighthouse-mobile     # Mobile performance audit
```

### Memory Analysis

- Memory leak detection with Memlab
- Automatic heap analysis during testing
- Results stored in `./tests/memory-leak/results/`

### Load Testing

- K6-based load testing
- Results exported to HTML dashboard
- Configurable test scripts in `test/load/`

## Common Development Issues & Solutions

### 1. Port Conflicts

- Development: Port 3000
- Storybook: Port 6006
- Production: Configured via `PROD_PORT` environment variable

### 2. Docker Issues

- Use `make clean` for complete cleanup
- Check `make ps` for container status
- Use `make sh` to debug inside container

### 3. Test Failures

- Check environment variables are properly set
- Ensure Docker containers are running for E2E tests
- Visual test failures may require snapshot updates

### 4. Build Issues

- Verify Node.js version matches requirements (>=20.0.0)
- Check TypeScript compilation with `make lint-tsc`
- Review ESLint errors with `make lint-eslint`

## Scripts and Utilities

The project includes several utility scripts:

- `scripts/get-pr-comments.sh` - GitHub PR comment retrieval tool
- `checkNodeVersion.js` - Node.js version validation
- Various test runners and configuration files

---

_Last updated: 2025-09-12_
