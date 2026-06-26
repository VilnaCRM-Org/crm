import ROUTE_PATHS from '@/routes/route-paths';

describe('ROUTE_PATHS', () => {
  it('home is "/"', () => {
    expect(ROUTE_PATHS.home).toBe('/');
  });

  it('signUp is "/sign-up"', () => {
    expect(ROUTE_PATHS.signUp).toBe('/sign-up');
  });

  it('signIn is "/sign-in"', () => {
    expect(ROUTE_PATHS.signIn).toBe('/sign-in');
  });

  it('notFound is "*"', () => {
    expect(ROUTE_PATHS.notFound).toBe('*');
  });

  it('all values are strings (AC1)', () => {
    for (const value of Object.values(ROUTE_PATHS)) {
      expect(typeof value).toBe('string');
    }
  });
});
