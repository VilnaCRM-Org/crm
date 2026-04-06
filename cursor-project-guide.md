# Cursor Project Guide

Comprehensive guide for working with VilnaCRM React Template in Cursor IDE and other
AI-powered development environments.

## Project Overview

This is a modern SPA template based on React 18.3, TypeScript, Material-UI v7,
featuring extensive CI checks, configured testing tools (Playwright, Jest),
and a modular architecture inspired by bulletproof-react.

For detailed tech stack and architecture information, see `CLAUDE.md` and `agents.md`.

## Quick Navigation

- [Code Review Workflow](#code-review-workflow-and-pr-refactoring)
- [Development Setup](#development-setup)
- [Testing Strategy](#testing-strategy)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Code Review Workflow and PR Refactoring

### Automated Code Review Comment Retrieval

**CRITICAL**: Always use `make pr-comments` to retrieve and address all code review comments systematically.

The repository provides a comprehensive code review workflow that enables automatic
retrieval and systematic addressing of all unresolved comments on a Pull Request.

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

##### For Committable Suggestions

```bash
# Apply suggestion directly to the code
# Example: If comment suggests changing component name
# Before: <UserInfo />
# After: <UserData />  (as suggested)

# Commit the change immediately
git add .
git commit -m "Apply code review suggestion: improve component naming"
```

##### For LLM Prompts

```bash
# Use the comment as a detailed prompt for refactoring
# Example: "Refactor this component to use custom hooks"
# 1. Analyze current implementation
# 2. Design custom hook approach
# 3. Implement changes following React best practices
# 4. Update tests accordingly
# 5. Verify with make lint and make test-unit-all
```

##### For Complex Refactoring Requests

```bash
# Break down large refactoring into smaller commits
# 1. Create interfaces/types first
# 2. Implement new components/hooks
# 3. Update existing code to use new structure
# 4. Remove deprecated code
# 5. Update tests and documentation
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

#### Handling Conflicting Comments

- Prioritize architectural concerns over stylistic preferences
- Discuss conflicting suggestions with reviewers before implementing
- Document decisions in commit messages or PR comments

#### Large-Scale Refactoring

- Create separate commits for each logical change
- Maintain backward compatibility when possible
- Update tests incrementally with code changes
- Use feature flags for risky changes

#### Performance and Security Comments

- Address security concerns immediately with highest priority
- Benchmark performance changes when suggested (use Lighthouse, K6)
- Document performance trade-offs in code comments

### Integration with Development Workflow

#### Before Starting Code Review Refactoring

```bash
git status                  # Ensure clean working directory
git pull origin main        # Get latest changes
make pr-comments           # Get current comment status
```

#### During Refactoring

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

#### After Completing All Comments

```bash
make lint                  # Full quality check
make test-unit-all         # Verify all tests pass
make pr-comments           # Verify no new unresolved comments
git push                   # Push all changes
```

## Development Setup

### Environment Requirements

- **Node.js**: >=24.8.0 (enforced via engineStrict)
- **pnpm**: >=9
- **Docker**: Latest stable version (for containerized development)

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd crm

# 2. Check Node version
make check-node-version

# 3. Install dependencies
make install

# 4. Set up git hooks
make husky

# 5. Start development server
make start
```

### Running Without Docker

Prefix any command with `CI=1`:

```bash
CI=1 make start
CI=1 make test-unit-all
CI=1 pnpm exec jest tests/unit/specific-test.test.tsx
```

## Testing Strategy

### Unit Tests

```bash
# Run all unit tests
make test-unit-all

# Client tests only (jsdom environment)
make test-unit-client

# Server tests only (Apollo Server, node environment)
make test-unit-server

# Single test file
CI=1 pnpm exec jest tests/unit/path/to/test.test.tsx

# Test with coverage
CI=1 pnpm exec jest --coverage --coverageReporters=text

# Watch mode for development
CI=1 pnpm exec jest --watch
```

### E2E Tests

```bash
# Run all E2E tests
make test-e2e

# E2E with UI mode
make test-e2e-ui

# Single E2E test
docker compose -f docker-compose.test.yml exec playwright \
  pnpm exec playwright test tests/e2e/login.spec.ts
```

### Visual Regression Tests

```bash
# Run visual tests
make test-visual

# Update snapshots (after intentional visual changes)
make test-visual-update

# Visual tests with UI
make test-visual-ui
```

### Performance Tests

```bash
# Memory leak detection
make test-memory-leak

# Load testing
make test-load

# Lighthouse audits
make lighthouse-desktop
make lighthouse-mobile

# Mutation testing
make test-mutation
```

## Common Tasks

### Adding a New Feature Module

```bash
# 1. Create module structure
mkdir -p src/modules/MyModule/features/MyFeature/{components,api,i18n,helpers}

# 2. Add translations
touch src/modules/MyModule/features/MyFeature/i18n/en.json
touch src/modules/MyModule/features/MyFeature/i18n/uk.json

# 3. Create API client (if needed)
touch src/modules/MyModule/features/MyFeature/api/MyFeatureAPI.ts

# 4. Register in DI container
# Edit src/config/DependencyInjectionConfig.ts
# Add token to src/config/tokens.ts

# 5. Create Redux slice
touch src/modules/MyModule/store/myModuleSlice.ts

# 6. Add tests
mkdir -p tests/unit/modules/MyModule
touch tests/unit/modules/MyModule/MyFeature.test.tsx

# 7. Verify everything works
make lint
make test-unit-all
```

### Fixing Linting Issues

```bash
# Check what's wrong
make lint-eslint
make lint-tsc
make lint-md

# Auto-fix what can be fixed
make format

# Fix remaining issues manually
# Then verify
make lint
```

### Updating Dependencies

```bash
# Update to latest allowed versions
make update

# Check for security vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Verify everything still works
make test-unit-all
make build
```

### Working with Storybook

```bash
# Start Storybook server
make storybook-start

# Build static Storybook
make storybook-build

# Add new story
touch src/components/UIMyComponent.stories.tsx
```

## Troubleshooting

### Issue: Tests fail with module resolution errors

**Solution**:

```bash
# Clear Jest cache
CI=1 pnpm exec jest --clearCache

# Verify path aliases in all configs match
# - tsconfig.paths.json
# - craco.config.js
# - jest.config.ts
```

### Issue: Docker container won't start

**Solution**:

```bash
# Check logs
make logs

# Clean and rebuild
make clean
make start

# Check for port conflicts
docker ps
# Kill conflicting containers
```

### Issue: E2E tests fail with API errors

**Solution**:

```bash
# Verify Mockoon is running
docker compose -f docker-compose.test.yml ps

# Check Mockoon logs
docker compose -f docker-compose.test.yml logs mockoon

# Restart Mockoon
docker compose -f docker-compose.test.yml restart mockoon
```

### Issue: Build fails with out of memory

**Solution**:

```bash
# Increase Node memory
export NODE_OPTIONS=--max-old-space-size=4096
make build
```

### Issue: GraphQL schema not loading

**Solution**:

```bash
# Stop containers
make down

# Check .env for GRAPHQL_SCHEMA_VERSION
cat .env | grep GRAPHQL_SCHEMA_VERSION

# Restart (will re-download schema)
make start

# Verify schema exists
ls -la docker/apollo-server/schema.graphql
```

## Best Practices for AI-Assisted Development

### Before Writing Code

1. **Search existing patterns**: Use grep/Glob to find similar implementations
2. **Check module structure**: Follow established patterns in `src/modules/`
3. **Review related tests**: Understand expected behavior
4. **Verify dependencies**: Check if required services are registered in DI

### While Writing Code

1. **Use path aliases**: Always `@/` imports, never relative paths
2. **Follow naming conventions**: UI components prefixed with `UI*`
3. **Add TypeScript types**: No `any` types without justification
4. **Internationalize strings**: Use i18n, no hardcoded text
5. **Write tests immediately**: Don't defer testing

### After Writing Code

1. **Run linters**: `make lint`
2. **Run tests**: `make test-unit-all`
3. **Manual verification**: `make start` and test in browser
4. **Check bundle impact**: `make build-analyze` if adding dependencies
5. **Update docs**: Document new APIs or significant changes

### Code Review Integration

1. **Retrieve comments**: `make pr-comments`
2. **Prioritize by type**: Committable > Prompts > Questions > Observations
3. **Apply systematically**: One comment/group at a time
4. **Verify after each**: `make lint && make test-unit-all`
5. **Document decisions**: Clear commit messages with context

## Project-Specific Conventions

### Component Structure

```ts
// src/components/UIMyComponent.tsx
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledRoot = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
}));

interface UIMyComponentProps {
  title: string;
  onAction?: () => void;
}

export const UIMyComponent: React.FC<UIMyComponentProps> = ({ title, onAction }) => {
  return (
    <StyledRoot>
      {/* Implementation */}
    </StyledRoot>
  );
};
```

### Redux Slice Structure

```ts
// src/modules/MyModule/store/myModuleSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ThunkExtra } from '@/stores/store';

export const fetchData = createAsyncThunk(
  'myModule/fetchData',
  async (params: Params, { extra, rejectWithValue }) => {
    try {
      const { myModuleAPI } = extra as ThunkExtra;
      return await myModuleAPI.getData(params);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const myModuleSlice = createSlice({
  name: 'myModule',
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

export default myModuleSlice.reducer;
```

### Test Structure

```ts
// tests/unit/components/UIMyComponent.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UIMyComponent } from '@/components/UIMyComponent';

describe('UIMyComponent', () => {
  it('renders with title', () => {
    render(<UIMyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn();
    render(<UIMyComponent title="Test" onAction={mockAction} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

## Git Workflow

### Commit Message Format

Follow conventional commits:

```bash
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `test`, `chore`, `docs`, `refactor`, `style`, `perf`

Examples:

```bash
feat(auth): add password reset functionality
fix(login): resolve token expiration issue
test(e2e): add user registration flow tests
chore(deps): update React to 18.3.1
docs(readme): update installation instructions
refactor(auth): extract validation to custom hook
```

### Branch Naming

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `test/test-description` - Test improvements
- `refactor/refactor-description` - Code refactoring

## Resources

- **CLAUDE.md**: Project overview and tech stack
- **agents.md**: AI agent-specific workflows and patterns
- **README.md**: User-facing documentation
- **GitHub Workflows** (`.github/workflows/`): CI/CD pipeline configurations
- **Makefile**: All available commands

## Keeping This Guide Updated

This document evolves with the project. When you discover new patterns,
solve common issues, or establish new conventions:

1. Update the relevant section
2. Add examples where helpful
3. Keep commands and code snippets current
4. Remove outdated information

**Last updated**: 2025-10-20
