import 'reflect-metadata';

import { container } from 'tsyringe';

import securityEventRegistrar from '@/services/security-events/di';
import securityEventCore from '@/services/security-events/security-event-core';
import SecurityEventReporter from '@/services/security-events/security-event-reporter';
import SECURITY_EVENT_TOKENS from '@/services/security-events/tokens';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('security-events composition root', () => {
  afterEach(() => {
    container.clearInstances();
  });

  it('registers the reporter as a singleton under its own token', () => {
    const scoped = container.createChildContainer();
    securityEventRegistrar.register(scoped);

    const first = scoped.resolve(SECURITY_EVENT_TOKENS.SecurityEventReporter);
    const second = scoped.resolve(SECURITY_EVENT_TOKENS.SecurityEventReporter);

    expect(first).toBeInstanceOf(SecurityEventReporter);
    expect(second).toBe(first);
  });

  // The token map is a module-level frozen literal, so it is evaluated inside the test body to
  // keep a mutant in it reachable by an assertion (issue #171).
  it('exposes exactly its own two tokens so registration ownership stays local', async () => {
    const tokens = await loadIsolated(
      async () => (await import('@/services/security-events/tokens')).default
    );

    expect(Object.keys(tokens)).toEqual(['SecurityEventReporter', 'SecurityEventCore']);
    expect(tokens.SecurityEventReporter.toString()).toBe('Symbol(SecurityEventReporter)');
    expect(tokens.SecurityEventCore.toString()).toBe('Symbol(SecurityEventCore)');
    expect(Object.isFrozen(tokens)).toBe(true);
  });

  // The container-free core is registered by value, so a class that injects it receives the very
  // instance the render path already uses rather than a second copy (issues #115, #130).
  it('binds the container-free core by value, not by construction', () => {
    const scoped = container.createChildContainer();
    securityEventRegistrar.register(scoped);

    expect(scoped.resolve(SECURITY_EVENT_TOKENS.SecurityEventCore)).toBe(securityEventCore);
  });
});
