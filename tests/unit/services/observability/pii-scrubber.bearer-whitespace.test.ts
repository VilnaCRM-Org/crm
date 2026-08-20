import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';

describe('PiiScrubber bearer-token whitespace handling', () => {
  const scrubber = new PiiScrubber();

  it.each([
    { separator: 'a single space', credential: 'Bearer abc.def-ghi' },
    { separator: 'repeated spaces', credential: 'Bearer   abc.def-ghi' },
    { separator: 'a tab and a space', credential: 'Bearer\t abc.def-ghi' },
    { separator: 'a newline and indentation', credential: 'Bearer\n  abc.def-ghi' },
  ])('redacts a bearer credential introduced by $separator', ({ credential }) => {
    const event: SentryEvent = { message: `authorization ${credential} rejected` };

    const result = scrubber.scrub(event);

    expect(result.message).toBe('authorization [redacted] rejected');
  });

  it('leaves a bare bearer scheme with no credential untouched', () => {
    const event: SentryEvent = { message: 'bearer  ' };

    const result = scrubber.scrub(event);

    expect(result.message).toBe('bearer  ');
  });
});
