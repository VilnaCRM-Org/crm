import correlationIdProvider, {
  CorrelationIdProvider,
} from '@/services/observability/correlation-id-provider';

describe('CorrelationIdProvider', () => {
  it('exposes the X-Request-Id header name', () => {
    expect(new CorrelationIdProvider().header).toBe('X-Request-Id');
  });

  it('starts with an empty current id', () => {
    expect(new CorrelationIdProvider().currentId).toBe('');
  });

  it('generates a non-empty id and stores it as the current id', () => {
    const provider = new CorrelationIdProvider();

    const id = provider.next();

    expect(id).toEqual(expect.any(String));
    expect(id.length).toBeGreaterThan(0);
    expect(provider.currentId).toBe(id);
  });

  it('generates a fresh id on each call', () => {
    const provider = new CorrelationIdProvider();

    expect(provider.next()).not.toBe(provider.next());
  });

  it('exports a shared singleton instance', () => {
    expect(correlationIdProvider).toBeInstanceOf(CorrelationIdProvider);
  });
});
