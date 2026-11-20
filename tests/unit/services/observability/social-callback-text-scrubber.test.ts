import SocialCallbackTextScrubber from '@/services/observability/social-callback-text-scrubber';

describe('SocialCallbackTextScrubber', () => {
  const scrub = (value: string): string => new SocialCallbackTextScrubber().scrub(value);

  it.each([
    ['a callback query', '/cb?code=c-1&state=s-1', '/cb?code=[redacted]&state=[redacted]'],
    ['a value at the start', 'state=s-1', 'state=[redacted]'],
    ['a value after whitespace', 'saw code=c-1 then', 'saw code=[redacted] then'],
    ['a fragment after the value', '/cb?code=c-1#top', '/cb?code=[redacted]#top'],
    ['upper-case keys', '/cb?CODE=c-1&STATE=s-1', '/cb?CODE=[redacted]&STATE=[redacted]'],
    [
      'a percent-encoded callback',
      'next=%2Fcb%3Fcode%3Dc-1%26state%3Ds-1%23x',
      'next=%2Fcb%3Fcode%3D[redacted]%26state%3D[redacted]%23x',
    ],
    ['a lower-case percent-encoded key', '%3fcode%3dc-1', '%3fcode%3d[redacted]'],
  ])('redacts %s', (_label, input, expected) => {
    expect(scrub(input)).toBe(expected);
  });

  it.each([
    ['an error_code value', '/x?error_code=state_expired'],
    ['a key that only ends in code', 'zipcode=12345'],
    ['a key that only ends in state', '/x?restate=1'],
    ['an encoded key that only ends in code', '%3Fpostcode%3D1'],
    ['text with no callback value', 'nothing to see'],
  ])('keeps %s', (_label, input) => {
    expect(scrub(input)).toBe(input);
  });
});
