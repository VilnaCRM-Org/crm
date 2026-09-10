import SecurityEventSignal from '@/services/security-events/security-event-signal';

describe('SecurityEventSignal', () => {
  it('carries a stable, groupable name and a namespaced message', () => {
    const signal = new SecurityEventSignal('auth_failure');

    expect(signal).toBeInstanceOf(Error);
    expect(signal.name).toBe('SecurityEventSignal');
    expect(signal.message).toBe('security.auth_failure');
    expect(signal.event).toBe('auth_failure');
  });

  it('keeps the prototype chain intact for every event name', () => {
    const signal = new SecurityEventSignal('auth_failure_burst');

    expect(signal instanceof SecurityEventSignal).toBe(true);
    expect(signal.message).toBe('security.auth_failure_burst');
  });
});
