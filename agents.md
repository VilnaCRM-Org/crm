# agents.md

AI Agent Guide for VilnaCRM React Template

This document provides workflows, patterns, and troubleshooting tips specifically for AI assistants working with this codebase. For project overview and tech stack details, see `CLAUDE.md`.

## Quick Start for Agents

### First-Time Setup Checklist

1. Verify Node version: `make check-node-version`
2. Install dependencies: `pnpm install` (or `make install` in Docker)
3. Set up git hooks: `make husky`
4. Start development: `make start`
5. Run initial tests: `make test-unit-all`

### Common Agent Tasks

#### Adding a New Feature

1. **Identify the module** - Features belong in `src/modules/` or `src/features/`
2. **Create feature structure**:
   ```
   src/modules/[Module]/features/[Feature]/
   ├── components/       # Feature UI components
   ├── api/             # API client and types
   ├── i18n/            # Translations (en.json, uk.json)
   ├── helpers/         # Feature utilities
   └── index.ts         # Public exports
   ```
3. **Add translations** - Always provide both `en.json` and `uk.json`
4. **Register services** - If needed, add to `src/config/DependencyInjectionConfig.ts`
5. **Add tests** - Unit tests in `tests/unit/`, E2E in `tests/e2e/`
6. **Run linters** - `make lint` before committing

#### Modifying Existing Code

1. **Search before changing**:

   ```bash
   # Find component usage
   grep -r "ComponentName" src/

   # Find API endpoints
   grep -r "mutation.*Operation" src/
   ```

2. **Check test coverage**:
   ```bash
   CI=1 make test-unit-all
   # Coverage report in terminal
   ```
3. **Update related tests** - Tests live in `tests/` mirroring `src/` structure
4. **Verify E2E tests pass** - `make test-e2e` (may take 5-10 minutes)

#### Fixing Bugs

1. **Reproduce locally** - Use `make start` or `make start-prod`
2. **Check console errors** - Look in browser DevTools and terminal
3. **Run affected tests**:

   ```bash
   # Single test file
   CI=1 pnpm exec jest tests/unit/path/to/test.test.tsx

   # Test pattern
   CI=1 pnpm exec jest --testNamePattern="test name"
   ```

4. **Fix and verify** - Ensure no regressions with `make test-unit-all`
5. **Update snapshots if needed** - `pnpm exec jest -u` (use cautiously)

## Code Review Workflow and PR Refactoring

### Automated Code Review Comment Retrieval

**CRITICAL**: Always use `make pr-comments` to retrieve and address all code review comments systematically.

The repository provides a comprehensive code review workflow that enables automatic retrieval and systematic addressing of all unresolved comments on a Pull Request.

#### Using the PR Comments Command

Basic usage:

```bash
make pr-comments                    # Auto-detect PR from current branch
make pr-comments PR=215             # Specify PR number explicitly
make pr-comments FORMAT=json        # Get comments in JSON format
make pr-comments FORMAT=markdown    # Get comments in Markdown format
```

Command features:

- **Auto-detection**: Automatically detects PR number from current git branch
- **Multiple formats**: Text (default), JSON, and Markdown output options
- **GitHub Enterprise support**: Configurable via GITHUB_HOST environment variable
- **Comprehensive output**: Shows file paths, line numbers, authors, timestamps, and GitHub URLs
- **Unresolved focus**: Only retrieves unresolved comments that require action

### Code Review Refactoring Workflow

**MANDATORY**: Follow this systematic approach for addressing code review feedback:

#### 1. Retrieve All Code Review Comments

```bash
make pr-comments
```

This command will output all unresolved comments in a readable format, showing:

- File path and line number where comment was made
- Author and timestamp of the comment
- Full comment content including suggestions and prompts
- Direct GitHub URL for context

#### 2. Analyze Comment Types and Prioritize

Categorize each comment by type:

##### A. Committable Suggestions (Highest Priority)

- Comments containing code suggestions that can be directly applied
- Usually prefixed with "suggestion" or contain code blocks
- **Action**: Apply the suggested changes exactly as provided
- **Priority**: Address these first as they provide explicit solutions

##### B. LLM Prompts and Instructions (High Priority)

- Comments providing specific instructions on how to refactor
- May include architectural guidance or implementation approaches
- **Action**: Use these as detailed prompts for code generation/refactoring
- **Priority**: Address after committable suggestions

##### C. Questions and Clarifications (Medium Priority)

- Comments asking for explanation or clarification of implementation
- **Action**: Reply with explanations and make code more self-documenting if needed
- **Priority**: Can be addressed alongside code changes

##### D. General Feedback and Observations (Low Priority)

- Comments providing general observations or praise
- **Action**: Consider for future improvements, no immediate action needed
- **Priority**: Address if time permits

#### 3. Systematic Implementation Strategy

##### For Committable Suggestions:

```typescript
// Apply suggestion directly to the code
// Example: If comment suggests changing component name
// Before: <UserInfo />
// After: <UserData />  (as suggested)

// Commit the change immediately
git add .
git commit -m "Apply code review suggestion: improve component naming"
```

##### For LLM Prompts:

```typescript
// Use the comment as a detailed prompt for refactoring
// Example: "Refactor this component to use custom hooks"
// 1. Analyze current implementation
// 2. Design custom hook approach
// 3. Implement changes following React best practices
// 4. Update tests accordingly
// 5. Verify with make lint and make test-unit-all
```

##### For Complex Refactoring Requests:

```typescript
// Break down large refactoring into smaller commits
// 1. Create interfaces/types first
// 2. Implement new components/hooks
// 3. Update existing code to use new structure
// 4. Remove deprecated code
// 5. Update tests and documentation
```

#### 4. Quality Assurance After Each Change

**MANDATORY**: Run quality checks after addressing each comment or group of related comments:

```bash
# For code changes
make lint-eslint              # Fix code style
make lint-tsc                 # Static type checking
make test-unit-all            # Run all unit tests
make lint                     # Full linting suite (for significant changes)

# For component changes
make test-unit-client         # Verify client tests pass
make test-e2e                 # Check E2E tests (for user-facing changes)

# For visual changes
make test-visual              # Visual regression tests
```

#### 5. Documentation and Verification

Update documentation when comments suggest:

- Component API documentation changes
- README updates
- Inline code comments for clarity
- Architecture decision records
- Storybook stories for new components

Verify changes meet requirements:

- All tests pass with expected coverage
- No regressions introduced
- Code quality metrics maintained (ESLint, TypeScript)
- Architectural boundaries respected (module structure)

#### 6. Comment Response Strategy

Reply to comments systematically:

- **Questions**: Provide clear, concise answers
- **Implemented suggestions**: Reply with commit hash that addresses the comment
- **Complex refactoring**: Explain approach taken and reference relevant commits
- **Cannot implement**: Explain technical constraints and propose alternatives

### Advanced Code Review Patterns

#### Handling Conflicting Comments:

- Prioritize architectural concerns over stylistic preferences
- Discuss conflicting suggestions with reviewers before implementing
- Document decisions in commit messages or PR comments

#### Large-Scale Refactoring:

- Create separate commits for each logical change
- Maintain backward compatibility when possible
- Update tests incrementally with code changes
- Use feature flags for risky changes

#### Performance and Security Comments:

- Address security concerns immediately with highest priority
- Benchmark performance changes when suggested (use Lighthouse, K6)
- Document performance trade-offs in code comments

### Integration with Development Workflow

#### Before Starting Code Review Refactoring:

```bash
git status                  # Ensure clean working directory
git pull origin main        # Get latest changes
make pr-comments           # Get current comment status
```

#### During Refactoring:

```bash
# Work on one comment or related group at a time
# Commit frequently with descriptive messages
# Reference comment URLs in commit messages for traceability

# Example commit message:
git commit -m "refactor(auth): extract validation to custom hook

Addresses review comment: https://github.com/org/repo/pull/123#discussion_r456789
- Created useFormValidation hook
- Updated LoginForm to use new hook
- Added unit tests for hook logic"
```

#### After Completing All Comments:

```bash
make lint                  # Full quality check
make test-unit-all         # Verify all tests pass
make pr-comments           # Verify no new unresolved comments
git push                   # Push all changes
```

### Example Workflow: Addressing Multiple Comment Types

```bash
# Step 1: Get all comments
make pr-comments > review-comments.txt

# Step 2: Address committable suggestions first
# Comment: "Suggestion: Extract this validation logic to a separate function"
# Implementation:
#   - Create new validation function
#   - Update component to use it
#   - Commit: "refactor: extract email validation to helper function"

git add src/modules/User/features/Auth/helpers/validators.ts
git add src/modules/User/features/Auth/components/LoginForm.tsx
git commit -m "refactor: extract email validation to helper function

Per review suggestion in PR #123"

# Step 3: Run quality checks
make lint-eslint
make test-unit-client

# Step 4: Address LLM prompts
# Comment: "Consider using React Hook Form for better form state management"
# Implementation:
#   - Research React Hook Form integration
#   - Refactor form to use hook
#   - Update validation logic
#   - Add tests

# Step 5: Push changes
git push origin feature/user-authentication

# Step 6: Reply to comments on GitHub
# - Mark resolved comments
# - Provide commit SHAs for reference
# - Ask follow-up questions if needed
```

### Code Review Quality Metrics

Track these metrics to ensure thorough review responses:

- **Resolution Rate**: Percentage of comments addressed
- **Time to Resolution**: Average time from comment to fix
- **Test Coverage**: Maintained or improved after refactoring
- **Regression Rate**: Number of new issues introduced by changes

### Common Review Comment Patterns in This Project

#### Pattern 1: TypeScript Type Safety

**Common Comment**: "Add proper TypeScript types instead of using `any`"

**Solution**:

```typescript
// Before
const handleSubmit = (data: any) => { ... }

// After
interface LoginFormData {
  email: string;
  password: string;
}

const handleSubmit = (data: LoginFormData) => { ... }
```

#### Pattern 2: Component Decomposition

**Common Comment**: "This component is too large, consider splitting it"

**Solution**:

```typescript
// Extract subcomponents
// Create: UILoginFormHeader, UILoginFormFields, UILoginFormActions
// Update tests for each new component
```

#### Pattern 3: Hook Extraction

**Common Comment**: "Extract this logic into a custom hook"

**Solution**:

```typescript
// Create: src/modules/User/features/Auth/hooks/useLoginForm.ts
// Update component to use hook
// Add tests: tests/unit/modules/User/features/Auth/hooks/useLoginForm.test.ts
```

#### Pattern 4: Error Handling

**Common Comment**: "Add proper error handling for this API call"

**Solution**:

```typescript
try {
  const result = await loginAPI.login(credentials);
  return result;
} catch (error) {
  if (isAPIError(error)) {
    // Handle specific API errors
    if (error instanceof ValidationError) {
      setFieldErrors(error.errors);
    }
  }
  throw error;
}
```

#### Pattern 5: Internationalization

**Common Comment**: "Hardcoded strings should be internationalized"

**Solution**:

```typescript
// Add to src/modules/User/features/Auth/i18n/en.json
{
  "login.title": "Sign In",
  "login.submit": "Log In"
}

// Update component
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('login.title')}</h1>
```

## Architecture Patterns

### Dependency Injection Pattern

```typescript
// 1. Define token in src/config/tokens.ts
export const TOKENS = {
  MyService: Symbol.for('MyService'),
};

// 2. Create injectable service
import { injectable } from 'tsyringe';

@injectable()
export class MyService {
  constructor() {}

  doSomething() {
    // Implementation
  }
}

// 3. Register in src/config/DependencyInjectionConfig.ts
container.registerSingleton<MyService>(TOKENS.MyService, MyService);

// 4. Use in Redux thunks
const thunkExtraArgument: ThunkExtra = {
  myService: container.resolve<MyService>(TOKENS.MyService),
};

// 5. Access in async thunks
export const myThunk = createAsyncThunk('module/action', async (_, { extra }) => {
  const { myService } = extra as ThunkExtra;
  return myService.doSomething();
});
```

### Redux Store Pattern

```typescript
// Module slice: src/modules/[Module]/store/[module]Slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchData = createAsyncThunk(
  'module/fetchData',
  async (params, { extra, rejectWithValue }) => {
    try {
      const { moduleAPI } = extra as ThunkExtra;
      return await moduleAPI.getData(params);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});
```

### API Error Handling Pattern

```typescript
// Check error type
import { isAPIError } from '@/modules/User/features/Auth/api/ApiErrors';
import { ValidationError } from '@/modules/User/features/Auth/api/ApiErrors/ValidationError';

if (isAPIError(error)) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    error.errors.forEach((err) => {
      console.log(err.field, err.message);
    });
  }
}
```

### Component Creation Pattern

```typescript
// UI component: src/components/UIComponentName.tsx
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledComponent = styled('div')(({ theme }) => ({
  // Emotion styles
  padding: theme.spacing(2),
}));

interface UIComponentNameProps {
  // Props definition
}

export const UIComponentName: React.FC<UIComponentNameProps> = (props) => {
  return <StyledComponent>{/* Implementation */}</StyledComponent>;
};

// Always prefix reusable UI components with "UI"
```

## Testing Strategies

### Unit Testing Best Practices

1. **Test file location**: Mirror `src/` structure in `tests/unit/`
   - Component test: `tests/unit/components/UIButton.test.tsx`
   - Service test: `tests/unit/services/HttpsClient.test.ts`

2. **Client vs Server tests**:

   ```bash
   # Client (jsdom environment)
   CI=1 pnpm exec jest tests/unit/components/

   # Server (node environment)
   CI=1 TEST_ENV=server pnpm exec jest tests/apollo-server/
   ```

3. **Mock external dependencies**:

   ```typescript
   jest.mock('@/services/HttpsClient');
   const mockHttpsClient = HttpsClient as jest.MockedClass<typeof HttpsClient>;
   ```

4. **Test coverage requirements**: Aim for >80% coverage on new code

### E2E Testing with Playwright

1. **Test structure**: `tests/e2e/[feature].spec.ts`
2. **Use Mockoon**: API responses are mocked via `docker-compose.test.yml`
3. **Page Object pattern**:

   ```typescript
   // tests/e2e/pages/LoginPage.ts
   export class LoginPage {
     constructor(private page: Page) {}

     async login(email: string, password: string) {
       await this.page.fill('[data-testid="email"]', email);
       await this.page.fill('[data-testid="password"]', password);
       await this.page.click('[data-testid="submit"]');
     }
   }
   ```

4. **Run specific test**:
   ```bash
   docker compose -f docker-compose.test.yml exec playwright \
     pnpm exec playwright test tests/e2e/login.spec.ts
   ```

### Visual Regression Testing

1. **Update snapshots**: `make test-visual-update`
2. **Review changes**: Check `tests/visual/.playwright/` for diffs
3. **Only update when intentional**: Don't blindly accept visual changes

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Cannot find module '@/...'"

**Cause**: Path alias not resolved

**Solution**: Check these configs match:

- `tsconfig.paths.json` - TypeScript
- `craco.config.js` - Webpack
- `jest.config.ts` - Jest tests

#### Issue: Tests fail with "reflect-metadata" error

**Cause**: DI container not initialized

**Solution**: Import `reflect-metadata` at test entry:

```typescript
import 'reflect-metadata';
import { container } from 'tsyringe';
```

#### Issue: Apollo Server not starting

**Cause**: GraphQL schema not downloaded

**Solution**:

```bash
make down
make start  # Re-downloads schema
```

Check `docker/apollo-server/schema.graphql` exists

#### Issue: E2E tests fail with network errors

**Cause**: Mockoon server not running

**Solution**:

```bash
docker compose -f docker-compose.test.yml up -d mockoon
docker compose -f docker-compose.test.yml logs mockoon
```

Verify Mockoon is on port 8080

#### Issue: Build fails with "out of memory"

**Cause**: Insufficient Node memory

**Solution**: Increase heap size:

```bash
export NODE_OPTIONS=--max-old-space-size=4096
make build
```

#### Issue: pnpm install fails

**Cause**: Wrong Node/pnpm version

**Solution**:

```bash
node --version  # Should be >=24.8.0
pnpm --version  # Should be >=9
nvm use        # If using nvm
```

#### Issue: Tests pass locally but fail in CI

**Cause**: Environment differences

**Solution**:

- Set `CI=1` when running locally: `CI=1 make test-unit-all`
- Check `.github/workflows/` for CI-specific configurations
- Verify Docker containers match CI setup

### Debugging Workflows

#### Debug React Components

1. Add debug output:

   ```typescript
   console.log('Component props:', props);
   ```

2. Use React DevTools in browser

3. Check Redux state:
   ```typescript
   import { useSelector } from 'react-redux';
   const state = useSelector((state) => state);
   console.log('Redux state:', state);
   ```

#### Debug Apollo Server

1. Check health endpoint: `curl http://localhost:4000/health`
2. Open GraphQL Playground: `http://localhost:4000/graphql`
3. View logs: `make logs`

#### Debug E2E Tests

1. Use UI mode: `make test-e2e-ui`
2. Add debug steps:
   ```typescript
   await page.pause(); // Pauses execution
   await page.screenshot({ path: 'debug.png' });
   ```
3. Check test artifacts: `tests/e2e/.playwright/results/`

## Performance Optimization

### Bundle Analysis

```bash
make build-analyze
# Opens webpack-bundle-analyzer in browser
```

**Look for**:

- Large dependencies (>500KB)
- Duplicate packages
- Unused code

### Load Testing with K6

```bash
# Edit scenario in tests/load/config.json.dist
make test-load
```

**Scenarios**:

- `smoke`: 1-2 VUs, 1 min (sanity check)
- `average`: 10 VUs, 5 min (normal load)
- `stress`: 50+ VUs, 10 min (breaking point)
- `spike`: Rapid VU increase (traffic burst)

### Memory Leak Detection

```bash
make test-memory-leak
# Uses Memlab to detect leaks in scenarios
```

**Check**: `tests/memory-leak/reports/` for heap analysis

## Git Workflow

### Commit Message Convention

Follow conventional commits:

```
feat(module): add user registration
fix(auth): resolve token expiration issue
test(e2e): add login flow tests
chore(deps): update dependencies
docs(readme): update installation steps
```

### Pre-commit Hooks

Husky runs automatically:

1. ESLint on staged files
2. TypeScript type checking
3. Prettier formatting

**Bypass (not recommended)**: `git commit --no-verify`

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `tests/*` - Test improvements

## Module Development Checklist

When creating a new module:

- [ ] Create module directory: `src/modules/[ModuleName]/`
- [ ] Add `package.json` with module metadata
- [ ] Create feature structure with `features/`, `store/`, `helpers/`
- [ ] Add i18n files: `i18n/en.json`, `i18n/uk.json`
- [ ] Register services in DI container
- [ ] Add tokens to `src/config/tokens.ts`
- [ ] Create Redux slice in `store/`
- [ ] Add RTK Query API if needed
- [ ] Write unit tests in `tests/unit/modules/[ModuleName]/`
- [ ] Add E2E tests if user-facing
- [ ] Update routes in `App.tsx` if needed
- [ ] Document public APIs in module README
- [ ] Run full test suite: `make test-unit-all && make test-e2e`

## Environment-Specific Notes

### Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start dev server
CI=1 pnpm start

# Run tests
CI=1 pnpm test

# Build
CI=1 pnpm build
```

### Docker Development (recommended)

All commands via Makefile:

```bash
make start      # Starts in container
make sh         # Shell access
make logs       # View logs
```

### CI/CD Environment

GitHub Actions runs:

1. Lint checks (ESLint, TSC, Markdown)
2. Unit tests (client + server)
3. Build verification
4. E2E tests (Playwright)
5. Visual regression tests
6. Lighthouse audits

See `.github/workflows/` for configuration

## Security Considerations

### Environment Variables

- Never commit `.env` files
- Use `.env.example` for documentation
- Sensitive values should be injected in CI/CD

### API Authentication

- Tokens stored in Redux (memory only)
- HTTP-only cookies for refresh tokens
- CORS configured in Apollo Server

### Dependency Audits

```bash
pnpm audit
pnpm audit --fix  # Auto-fix vulnerabilities
```

Run monthly or when dependabot alerts

## Agent Best Practices

### Before Making Changes

1. **Understand the impact**: Search for usage across codebase
2. **Check existing tests**: Don't break what works
3. **Read module documentation**: Check module `package.json` and READMEs
4. **Verify conventions**: Follow existing patterns

### While Making Changes

1. **Use path aliases**: Always `@/` imports, never relative `../../`
2. **Type everything**: No `any` types without justification
3. **Add tests immediately**: Don't defer testing
4. **Localize strings**: No hardcoded English text

### After Making Changes

1. **Run linters**: `make lint`
2. **Run tests**: `make test-unit-all`
3. **Manual verification**: `make start` and test in browser
4. **Check bundle size**: `make build-analyze` if adding dependencies
5. **Update docs**: If changing public APIs

### Code Review Self-Check

- [ ] All tests pass
- [ ] No linter errors
- [ ] TypeScript compiles without errors
- [ ] No console warnings in browser
- [ ] Added tests for new functionality
- [ ] Updated relevant documentation
- [ ] Follows project conventions
- [ ] No hardcoded values (use config)
- [ ] Proper error handling
- [ ] Translations provided (en + uk)

## Useful Commands Reference

### Development

```bash
make start              # Start dev server
make start-prod         # Start production build
make sh                 # Open shell in container
make logs               # View dev logs
make new-logs           # Stream new logs only
```

### Testing

```bash
make test-unit-all      # All unit tests
make test-unit-client   # Client unit tests
make test-unit-server   # Server unit tests
make test-e2e           # E2E tests
make test-e2e-ui        # E2E with UI
make test-visual        # Visual regression
make test-memory-leak   # Memory leak detection
make test-load          # Load testing
make test-mutation      # Mutation testing
```

### Code Quality

```bash
make lint               # All linters
make lint-eslint        # ESLint only
make lint-tsc           # TypeScript only
make lint-md            # Markdown only
make format             # Prettier format
```

### Building

```bash
make build              # Build in Docker
make build-out          # Extract build to ./build
make build-analyze      # Bundle analyzer
```

### Utilities

```bash
make ps                 # Show running containers
make down               # Stop all containers
make clean              # Clean everything
make husky              # Setup git hooks
make check-node-version # Verify Node version
```

## Additional Resources

- **CLAUDE.md**: Project overview and tech stack
- **cursor_project_guide.md**: Comprehensive guide for AI-powered development with code review workflows
- **README.md**: User-facing documentation
- **package.json**: Scripts and dependencies
- **.github/workflows/**: CI/CD pipelines
- **docker/**: Docker configurations
- **tests/**: All test files and configurations

## Feedback and Improvements

This document is maintained alongside the codebase. When patterns emerge or common issues are resolved, update this guide to help future agents work more effectively.

**Last updated**: 2025-10-20
