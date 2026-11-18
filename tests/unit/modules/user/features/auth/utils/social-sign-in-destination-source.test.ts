import socialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';

const KEY = 'crm.socialSignIn.destination';
const from = (pathname: string, search = '', hash = ''): unknown => ({
  from: { pathname, search, hash },
});

describe('socialSignInDestinationSource', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('keeps an internal destination, with its query and hash, for one read', () => {
    socialSignInDestinationSource.save(from('/settings', '?tab=2', '#security'));

    expect(window.sessionStorage.getItem(KEY)).toBe('/settings?tab=2#security');
    expect(socialSignInDestinationSource.take()).toBe('/settings?tab=2#security');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(socialSignInDestinationSource.take()).toBe('/');
  });

  it('stores home when the router state names no safe destination', () => {
    socialSignInDestinationSource.save(from('//evil.example'));

    expect(window.sessionStorage.getItem(KEY)).toBe('/');
  });

  it.each([
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative path', '//evil.example'],
    ['a backslash path', '/\\evil.example'],
    ['the sign-in page', '/sign-in'],
    ['a relative path', 'settings'],
  ])('re-validates %s planted in storage and falls back to home', (_label, planted) => {
    window.sessionStorage.setItem(KEY, planted);

    expect(socialSignInDestinationSource.take()).toBe('/');
  });

  it('falls back to home and never throws when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => socialSignInDestinationSource.save(from('/settings'))).not.toThrow();
    expect(socialSignInDestinationSource.take()).toBe('/');
  });
});
