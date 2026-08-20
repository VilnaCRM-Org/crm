import sessionCorrelation, {
  SessionCorrelation,
} from '@/services/observability/session-correlation';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('SessionCorrelation', () => {
  it('exposes the X-Correlation-Id header name', () => {
    expect(sessionCorrelation.header).toBe('X-Correlation-Id');
    expect(new SessionCorrelation().header).toBe('X-Correlation-Id');
  });

  it('generates one opaque v4 identifier per session and never rotates it', () => {
    const id = sessionCorrelation.id();

    expect(id).toMatch(UUID_V4);
    expect(sessionCorrelation.id()).toBe(id);
  });

  it('gives a separate session its own identifier', () => {
    expect(new SessionCorrelation().id()).not.toBe(new SessionCorrelation().id());
  });
});
