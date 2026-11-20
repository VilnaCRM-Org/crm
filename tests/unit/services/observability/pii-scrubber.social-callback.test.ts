import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';

describe('PiiScrubber social callback redaction (specs/social-sign-in, NFR7)', () => {
  const scrubMessage = (message: string): unknown =>
    new PiiScrubber().scrub({ message } as SentryEvent);

  it('redacts the code and state of a callback URL a navigation breadcrumb keeps', () => {
    const event = {
      breadcrumbs: [
        {
          category: 'navigation',
          data: {
            from: '/auth/callback/google?code=4%2F0Ab-secret&state=3f2504e0-4f89-41d3',
            to: '/auth/callback/google',
          },
        },
      ],
    } as unknown as SentryEvent;

    expect(new PiiScrubber().scrub(event)).toEqual({
      breadcrumbs: [
        {
          category: 'navigation',
          data: {
            from: '/auth/callback/google?code=[redacted]&state=[redacted]',
            to: '/auth/callback/google',
          },
        },
      ],
    });
  });

  it.each([
    ['state first', '/cb?state=s-1&code=c-1', '/cb?state=[redacted]&code=[redacted]'],
    ['a fragment', '/cb?code=c-1#top', '/cb?code=[redacted]#top'],
    ['whitespace', 'saw code=c-1 then', 'saw code=[redacted] then'],
    ['the start of the string', 'state=s-1', 'state=[redacted]'],
    ['upper case', '/cb?CODE=c-1&STATE=s-1', '/cb?CODE=[redacted]&STATE=[redacted]'],
    [
      'a percent-encoded callback',
      'next=%2Fauth%2Fcallback%2Fgoogle%3Fcode%3Dc-1%26state%3Ds-1%23x',
      'next=%2Fauth%2Fcallback%2Fgoogle%3Fcode%3D[redacted]%26state%3D[redacted]%23x',
    ],
    ['a lower-case percent-encoded code', '%3fcode%3dc-1', '%3fcode%3d[redacted]'],
  ])('redacts the values with %s', (_name, input, expected) => {
    expect(scrubMessage(input)).toEqual({ message: expected });
  });

  it.each([
    ['an error_code query value', '/x?error_code=state_expired', '/x?error_code=state_expired'],
    ['a key that only ends in code', 'zipcode=12345', 'zipcode=12345'],
    ['a key that only ends in state', '/x?restate=1', '/x?restate=1'],
    ['an encoded key that only ends in code', '%3Fpostcode%3D1', '%3Fpostcode%3D1'],
  ])('keeps %s', (_name, input, expected) => {
    expect(scrubMessage(input)).toEqual({ message: expected });
  });
});
