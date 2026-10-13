import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';
import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';

describe('PiiScrubber reset token redaction (#315)', () => {
  const scrubber = new PiiScrubber();
  const scrubUrl = (url: string): unknown => scrubber.scrub({ request: { url } } as SentryEvent);

  it('redacts the token query value and keeps the rest of the URL', () => {
    expect(scrubUrl('https://app/password-reset?token=abc&x=1')).toEqual({
      request: { url: 'https://app/password-reset?token=[redacted]&x=1' },
    });
  });

  it.each([
    ['a fragment', 'https://app/password-reset?token=abc#frag', 'token=[redacted]#frag'],
    ['whitespace', 'see token=abc next', 'see token=[redacted] next'],
    ['the end of the string', 'token=abc', 'token=[redacted]'],
    ['upper case', 'TOKEN=abc&x=1', 'TOKEN=[redacted]&x=1'],
  ])('stops the redaction at %s', (_name, input, expected) => {
    expect(scrubber.scrub({ message: input } as SentryEvent)).toEqual({
      message: expect.stringContaining(expected),
    });
  });

  it('leaves a string without a token fragment unchanged', () => {
    expect(scrubber.scrub({ message: 'nothing to see here' } as SentryEvent)).toEqual({
      message: 'nothing to see here',
    });
  });

  it('removes the token, new password and e-mail values from every nesting', () => {
    const token = buildResetToken();
    const newPassword = buildPassword();
    const email = buildEmail();
    const input = { token, newPassword, email };
    const event = {
      extra: { ...input, variables: { input } },
      breadcrumbs: [{ category: 'fetch', data: { variables: { input } } }],
    } as unknown as SentryEvent;

    const serialized = JSON.stringify(scrubber.scrub(event));

    [token, newPassword, email].forEach((value) => expect(serialized).not.toContain(value));
  });
});
