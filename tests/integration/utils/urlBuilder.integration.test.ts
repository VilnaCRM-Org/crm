import '../setup';
import buildApiUrl from '@/utils/urlBuilder';

describe('urlBuilder', () => {
  const originalEnv = process.env.REACT_APP_MOCKOON_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.REACT_APP_MOCKOON_URL;
    } else {
      process.env.REACT_APP_MOCKOON_URL = originalEnv;
    }
  });

  describe('with base URL', () => {
    it('should combine base URL and endpoint', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api';

      const result = buildApiUrl('/users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle base URL with trailing slash', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api/';

      const result = buildApiUrl('/users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle base URL with multiple trailing slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api///';

      const result = buildApiUrl('/users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle endpoint without leading slash', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api';

      const result = buildApiUrl('users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle endpoint with multiple leading slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api';

      const result = buildApiUrl('///users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle both base URL and endpoint with slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api/';

      const result = buildApiUrl('/users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle base URL with whitespace', () => {
      process.env.REACT_APP_MOCKOON_URL = '  http://localhost:8080/api  ';

      const result = buildApiUrl('/users');

      expect(result).toBe('http://localhost:8080/api/users');
    });

    it('should handle nested endpoints', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api';

      const result = buildApiUrl('/users/123/profile');

      expect(result).toBe('http://localhost:8080/api/users/123/profile');
    });
  });

  it('should preserve query string and not double-encode', () => {
    process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api/';
    const result = buildApiUrl('/users?active=true&role=admin');
    expect(result).toBe('http://localhost:8080/api/users?active=true&role=admin');
  });

  it('should preserve URL fragment', () => {
    process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080/api';
    const result = buildApiUrl('/users#section');
    expect(result).toBe('http://localhost:8080/api/users#section');
  });

  describe('without base URL', () => {
    it('should return endpoint with leading slash when base URL is empty', () => {
      process.env.REACT_APP_MOCKOON_URL = '';

      const result = buildApiUrl('/users');

      expect(result).toBe('/users');
    });

    it('should return endpoint with leading slash when base URL is undefined', () => {
      delete process.env.REACT_APP_MOCKOON_URL;

      const result = buildApiUrl('/users');

      expect(result).toBe('/users');
    });

    it('should add leading slash when base URL is empty and endpoint has no slash', () => {
      process.env.REACT_APP_MOCKOON_URL = '';

      const result = buildApiUrl('users');

      expect(result).toBe('/users');
    });

    it('should handle whitespace-only base URL', () => {
      process.env.REACT_APP_MOCKOON_URL = '   ';

      const result = buildApiUrl('/users');

      expect(result).toBe('/users');
    });
  });
});
