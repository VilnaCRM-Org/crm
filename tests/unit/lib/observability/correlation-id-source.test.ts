import correlationIdSource, {
  CorrelationIdSource,
} from '@/lib/observability/correlation-id-source';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('CorrelationIdSource', () => {
  it('mints an id on the first read instead of answering with an empty string', () => {
    const source = new CorrelationIdSource();

    expect(source.current()).toMatch(UUID);
  });

  it('keeps answering with the same id until it is rotated', () => {
    const source = new CorrelationIdSource();

    const first = source.current();

    expect(source.current()).toBe(first);
    expect(source.current()).toBe(first);
  });

  it('rotates to a fresh id, and reads follow the rotation', () => {
    const source = new CorrelationIdSource();
    const first = source.current();

    const rotated = source.next();

    expect(rotated).toMatch(UUID);
    expect(rotated).not.toBe(first);
    expect(source.current()).toBe(rotated);
  });

  it('rotates to a different id on every call', () => {
    const source = new CorrelationIdSource();

    expect(source.next()).not.toBe(source.next());
  });

  it('exports a shared singleton instance', () => {
    expect(correlationIdSource).toBeInstanceOf(CorrelationIdSource);
  });
});
