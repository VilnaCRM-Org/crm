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
    [
      'an encoded first letter',
      '/cb?%63ode=c-1&%73tate=s-1',
      '/cb?code=[redacted]&state=[redacted]',
    ],
    [
      'fully encoded names',
      '/cb?%63%6f%64%65=c-1&%73%74%61%74%65=s-1',
      '/cb?code=[redacted]&state=[redacted]',
    ],
    [
      'fully encoded upper-case names',
      '/cb?%43%4F%44%45=c-1&%53%54%41%54%45=s-1',
      '/cb?CODE=[redacted]&STATE=[redacted]',
    ],
    ['a doubly encoded name', '%3F%2563ode%3Dc-1', '%3Fcode%3D[redacted]'],
  ])('redacts %s', (_label, input, expected) => {
    expect(scrub(input)).toBe(expected);
  });

  it.each([
    ['an error_code value', '/x?error_code=state_expired'],
    ['a key that only ends in code', 'zipcode=12345'],
    ['a key that only ends in state', '/x?restate=1'],
    ['an encoded key that only ends in code', '%3Fpostcode%3D1'],
    ['text with no callback value', 'nothing to see'],
    ['an encoded name that is neither', '/x?%6eame=1%41'],
    ['an encoded separator', '/x?name%3Dcode%40a'],
  ])('keeps %s', (_label, input) => {
    expect(scrub(input)).toBe(input);
  });
});
