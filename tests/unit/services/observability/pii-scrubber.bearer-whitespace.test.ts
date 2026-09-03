import { PiiScrubber } from '@/services/observability/pii-scrubber';
import type { SentryEvent } from '@/services/types/observability/sentry';

// The pattern table is an instance field, so it is only evaluated when a scrubber is
// constructed. Building one at describe scope evaluates it outside every test body, which
// leaves the literals covered by no test at all; each test constructs its own instead.
describe('PiiScrubber bearer-token whitespace handling', () => {
  it.each([
    { separator: 'a single space', credential: 'Bearer abc.def-ghi' },
    { separator: 'repeated spaces', credential: 'Bearer   abc.def-ghi' },
    { separator: 'a tab and a space', credential: 'Bearer\t abc.def-ghi' },
    { separator: 'a newline and indentation', credential: 'Bearer\n  abc.def-ghi' },
  ])('redacts a bearer credential introduced by $separator', ({ credential }) => {
    const event: SentryEvent = { message: `authorization ${credential} rejected` };

    const result = new PiiScrubber().scrub(event);

    expect(result.message).toBe('authorization [redacted] rejected');
  });

  it('leaves a bare bearer scheme with no credential untouched', () => {
    const event: SentryEvent = { message: 'bearer  ' };

    const result = new PiiScrubber().scrub(event);

    expect(result.message).toBe('bearer  ');
  });
});
