// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('client security instrumentation (#159)', () => {
  it('injects the observability-backed reporter into the root error boundary', () => {
    const entry = readFile('src/index.tsx');

    expect(entry).toMatch(/<AppErrorBoundary reporter={observabilityCore}>/);
    expect(entry).toContain(
      "import observabilityCore from '@/services/observability/observability-core'"
    );
  });

  it('binds a non-noop ErrorReporter in the production composition root', () => {
    const registrar = readFile('src/services/error-reporting/di.ts');

    expect(registrar).toContain('ERROR_REPORTING_TOKENS.ErrorReporter, ObservabilityErrorReporter');
    expect(registrar).toContain('container.registerSingleton(');
    expect(registrar).not.toContain('NoopErrorReporter');
  });

  it('registers the security-event composition root in the DI aggregator', () => {
    const aggregator = readFile('src/config/dependency-injection-config.ts');

    expect(aggregator).toContain(
      "import securityEventRegistrar from '@/services/security-events/di'"
    );
    expect(aggregator).toMatch(/^\s*securityEventRegistrar,$/m);
  });

  it('documents the auth-failure alert threshold in the committed env template', () => {
    const example = readFile('.env.example');

    expect(example).toMatch(/^REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD=\d+$/m);
    expect(example).toMatch(/^REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS=\d+$/m);
  });

  it('attaches the session correlation header to both transports', () => {
    expect(readFile('src/services/https-client/http-request-config-builder.ts')).toContain(
      'nextHeaders[sessionCorrelation.header] = sessionCorrelation.id();'
    );
    expect(readFile('src/services/observability/apollo-link-factory.ts')).toContain(
      '[sessionCorrelation.header]: sessionCorrelation.id(),'
    );
  });
});
