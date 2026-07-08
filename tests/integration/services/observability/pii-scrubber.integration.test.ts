import piiScrubber, { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';

const DENIED_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'Authorization',
  'Cookie',
  'cookies',
  'Set-Cookie',
  'secret',
  'apiKey',
  'email',
];

describe('PiiScrubber', () => {
  const scrubber = new PiiScrubber();

  it.each(DENIED_KEYS)('drops the denied key "%s" case-insensitively at any depth', (key) => {
    const event: SentryEvent = { extra: { nested: { [key]: 'sensitive' }, keep: 'ok' } };

    const result = scrubber.scrub(event);

    expect(result.extra).toEqual({ nested: {}, keep: 'ok' });
  });

  it('redacts email, bearer token, and JWT values inside free-text fields', () => {
    const event: SentryEvent = {
      message: 'login failed for alice@example.com',
      exception: { values: [{ value: 'Bearer abc.def-ghi rejected' }] },
      breadcrumbs: [{ message: 'issued eyJhbGciOi.JeyJzdWIi.Qsdfx now' }],
    };

    const result = scrubber.scrub(event);

    expect(result.message).toBe('login failed for [redacted]');
    expect((result.exception as { values: Array<{ value: string }> }).values[0].value).toBe(
      '[redacted] rejected'
    );
    expect((result.breadcrumbs as Array<{ message: string }>)[0].message).toBe(
      'issued [redacted] now'
    );
  });

  it('keeps non-sensitive strings, numbers, and null untouched', () => {
    const event: SentryEvent = { extra: { route: '/sign-in', count: 5, nothing: null } };

    const result = scrubber.scrub(event);

    expect(result.extra).toEqual({ route: '/sign-in', count: 5, nothing: null });
  });

  it('recurses through arrays of values', () => {
    const event: SentryEvent = { extra: { list: ['plain', 'bob@corp.io'] } };

    const result = scrubber.scrub(event);

    expect(result.extra).toEqual({ list: ['plain', '[redacted]'] });
  });

  it('exports a shared singleton instance', () => {
    expect(piiScrubber).toBeInstanceOf(PiiScrubber);
  });
});
