import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';
import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';

describe('PiiScrubber reset token redaction (#315)', () => {
  const scrubUrl = (url: string): unknown =>
    new PiiScrubber().scrub({ request: { url } } as SentryEvent);
  const scrubMessage = (message: string): unknown =>
    new PiiScrubber().scrub({ message } as SentryEvent);

  it('redacts the token query value and keeps the rest of the URL', () => {
    expect(scrubUrl('https://app/password-reset?token=abc&x=1')).toEqual({
      request: { url: 'https://app/password-reset?token=[redacted]&x=1' },
    });
  });

  it.each([
    [
      'a fragment',
      'https://app/password-reset?token=abc#frag',
      'https://app/password-reset?token=[redacted]#frag',
    ],
    ['whitespace', 'see token=abc next', 'see token=[redacted] next'],
    ['the end of the string', 'token=abc', 'token=[redacted]'],
    ['upper case', 'TOKEN=abc&x=1', 'TOKEN=[redacted]&x=1'],
  ])('redacts the whole token value and stops at %s', (_name, input, expected) => {
    expect(scrubMessage(input)).toEqual({ message: expected });
  });

  it.each([
    ['a JSON token value', '{"token":"abc","x":1}', '{"token":"[redacted]","x":1}'],
    ['a spaced JSON token value', '{"token" : "abc"}', '{"token" : "[redacted]"}'],
    ['a JSON new password value', '{"newPassword":"Secret1"}', '{"newPassword":"[redacted]"}'],
    ['a JSON access token value', '{"access_token":"abc"}', '{"access_token":"[redacted]"}'],
    ['a hyphenated JSON token key', '{"x-reset-token":"abc"}', '{"x-reset-token":"[redacted]"}'],
    [
      'a percent-encoded token',
      'next=%2Fpassword-reset%3Ftoken%3Dabc%26x%3D1',
      'next=%2Fpassword-reset%3Ftoken%3D[redacted]%26x%3D1',
    ],
    ['a lower-case percent-encoded token', 'token%3dabc', 'token%3d[redacted]'],
  ])('redacts %s inside serialized text', (_name, input, expected) => {
    expect(scrubMessage(input)).toEqual({ message: expected });
  });

  it('keeps an empty JSON token value and unrelated JSON keys', () => {
    expect(scrubMessage('{"token":"","tokenless":1,"name":"abc"}')).toEqual({
      message: '{"token":"","tokenless":1,"name":"abc"}',
    });
  });

  it('leaves a string without a token fragment unchanged', () => {
    expect(scrubMessage('nothing to see here')).toEqual({
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

    const serialized = JSON.stringify(new PiiScrubber().scrub(event));

    [token, newPassword, email].forEach((value) => expect(serialized).not.toContain(value));
  });
});
