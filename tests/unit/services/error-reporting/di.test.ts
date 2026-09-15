import 'reflect-metadata';

import { container } from 'tsyringe';

import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import errorReportingRegistrar from '@/services/error-reporting/di';
import ObservabilityErrorReporter from '@/services/error-reporting/observability-error-reporter';
import ERROR_REPORTING_TOKENS from '@/services/error-reporting/tokens';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('error-reporting composition root', () => {
  afterEach(() => {
    container.clearInstances();
  });

  it('binds nothing until it is asked to register', () => {
    const scoped = container.createChildContainer();

    expect(scoped.isRegistered(ERROR_REPORTING_TOKENS.ErrorReporter)).toBe(false);
    expect(scoped.isRegistered(ERROR_REPORTING_TOKENS.BoundaryErrorReporter)).toBe(false);
  });

  it('registers the observability-backed reporter as a singleton under its own token', () => {
    const scoped = container.createChildContainer();
    errorReportingRegistrar.register(scoped);

    const first = scoped.resolve(ERROR_REPORTING_TOKENS.ErrorReporter);
    const second = scoped.resolve(ERROR_REPORTING_TOKENS.ErrorReporter);

    expect(first).toBeInstanceOf(ObservabilityErrorReporter);
    expect(second).toBe(first);
  });

  // The boundary reporter is registered by value: a container-resolved consumer receives the very
  // instance the app shell and the auth boundary already hold by prop, never a second copy.
  it('binds the boundary reporter to the instance the shell passes by prop', () => {
    const scoped = container.createChildContainer();
    errorReportingRegistrar.register(scoped);

    expect(scoped.resolve(ERROR_REPORTING_TOKENS.BoundaryErrorReporter)).toBe(
      boundaryErrorReporter
    );
    expect(scoped.resolve(ERROR_REPORTING_TOKENS.BoundaryErrorReporter)).toBe(
      boundaryErrorReporter
    );
  });

  // The token map is a module-level frozen literal, so it is evaluated inside the test body to
  // keep a mutant in it reachable by an assertion (issue #171).
  it('exposes exactly its own two tokens so registration ownership stays local', async () => {
    const tokens = await loadIsolated(
      async () => (await import('@/services/error-reporting/tokens')).default
    );

    expect(Object.keys(tokens)).toEqual(['ErrorReporter', 'BoundaryErrorReporter']);
    expect(tokens.ErrorReporter.toString()).toBe('Symbol(ErrorReporter)');
    expect(tokens.BoundaryErrorReporter.toString()).toBe('Symbol(BoundaryErrorReporter)');
    expect(Object.isFrozen(tokens)).toBe(true);
  });
});
