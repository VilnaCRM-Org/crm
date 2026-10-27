import loginRedirectTarget from '@auth/utils/login-redirect-target';

describe('loginRedirectTarget.resolve', () => {
  it('joins pathname, search, and hash of the preserved location', () => {
    const state = { from: { pathname: '/deals', search: '?tab=open', hash: '#top' } };
    expect(loginRedirectTarget.resolve(state)).toBe('/deals?tab=open#top');
  });

  it('returns the pathname alone when search and hash are absent', () => {
    expect(loginRedirectTarget.resolve({ from: { pathname: '/contacts' } })).toBe('/contacts');
  });

  it('falls back to home when state is missing', () => {
    expect(loginRedirectTarget.resolve(undefined)).toBe('/');
    expect(loginRedirectTarget.resolve(null)).toBe('/');
    expect(loginRedirectTarget.resolve({})).toBe('/');
  });

  it('falls back to home when the pathname is not a string', () => {
    expect(loginRedirectTarget.resolve({ from: { pathname: 42 } })).toBe('/');
  });

  it('rejects relative and protocol-relative targets', () => {
    expect(loginRedirectTarget.resolve({ from: { pathname: 'evil' } })).toBe('/');
    expect(loginRedirectTarget.resolve({ from: { pathname: '//evil.example' } })).toBe('/');
  });

  // Browsers normalise `\` to `/` in http(s) URLs, so a backslash form reaches the same
  // cross-origin target the `//` guard rejects.
  it.each([['/\\evil.example'], ['/\\/evil.example'], ['\\\\evil.example'], ['/ok\\path']])(
    'rejects the backslash target %j',
    (pathname) => {
      expect(loginRedirectTarget.resolve({ from: { pathname } })).toBe('/');
    }
  );

  it('never redirects back to the sign-in page itself', () => {
    expect(loginRedirectTarget.resolve({ from: { pathname: '/sign-in', search: '?x=1' } })).toBe(
      '/'
    );
  });

  it.each([
    ['/sign-in/two-factor', '?x=1', '#t'],
    ['/sign-in/two-factor', undefined, undefined],
  ])('never redirects back to the challenge page %s', (pathname, search, hash) => {
    expect(loginRedirectTarget.resolve({ from: { pathname, search, hash } })).toBe('/');
  });

  it.each([['//evil.example'], ['/\\evil.example']])('sends %j home', (pathname) => {
    expect(loginRedirectTarget.resolve({ from: { pathname, search: '?x=1' } })).toBe('/');
  });

  it('keeps a query and fragment on an ordinary target', () => {
    expect(
      loginRedirectTarget.resolve({ from: { pathname: '/', search: '?x=1', hash: '#t' } })
    ).toBe('/?x=1#t');
  });

  it('drops non-string search and hash values', () => {
    const state = { from: { pathname: '/deals', search: 7, hash: { bad: true } } };
    expect(loginRedirectTarget.resolve(state)).toBe('/deals');
  });
});
