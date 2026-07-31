import urlBuilder from '@/utils/url-builder';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

describe('urlBuilder', () => {
  const originalEnv = process.env.REACT_APP_MOCKOON_URL;

  afterEach(() => {
    process.env.REACT_APP_MOCKOON_URL = originalEnv;
    clearConfigBlock();
  });

  describe('runtime configuration (issue #145)', () => {
    it('prefers the runtime apiBaseUrl over the build-time one', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://build-time.example.com';
      writeConfigBlock(JSON.stringify({ apiBaseUrl: 'https://runtime.example.com' }));

      expect(urlBuilder.build('users')).toBe('https://runtime.example.com/users');
    });

    it('falls back to the build-time origin when the runtime value is blank', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://build-time.example.com';
      writeConfigBlock(JSON.stringify({ apiBaseUrl: '   ' }));

      expect(urlBuilder.build('users')).toBe('https://build-time.example.com/users');
    });

    it.each(['not-a-url', '/api', 'mailto:someone@example.com', 'javascript:alert(1)'])(
      'falls back to the build-time origin rather than passing %s to fetch',
      (apiBaseUrl) => {
        process.env.REACT_APP_MOCKOON_URL = 'https://build-time.example.com';
        writeConfigBlock(JSON.stringify({ apiBaseUrl }));

        expect(urlBuilder.build('users')).toBe('https://build-time.example.com/users');
      }
    );

    it('falls back to the build-time origin when no runtime block is rendered', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://build-time.example.com';

      expect(urlBuilder.build('users')).toBe('https://build-time.example.com/users');
    });
  });

  describe('with base URL configured', () => {
    it('should build URL with base URL and endpoint', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('users')).toBe('https://api.example.com/users');
    });

    it('should handle endpoint with leading slash', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('/users')).toBe('https://api.example.com/users');
    });

    it('should handle base URL with trailing slash', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com/';
      expect(urlBuilder.build('users')).toBe('https://api.example.com/users');
    });

    it('should handle both base URL and endpoint with slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com/';
      expect(urlBuilder.build('/users')).toBe('https://api.example.com/users');
    });

    it('should handle base URL with multiple trailing slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com///';
      expect(urlBuilder.build('users')).toBe('https://api.example.com/users');
    });

    it('should handle endpoint with multiple leading slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('///users')).toBe('https://api.example.com/users');
    });

    it('should handle base URL with whitespace', () => {
      process.env.REACT_APP_MOCKOON_URL = '  https://api.example.com  ';
      expect(urlBuilder.build('users')).toBe('https://api.example.com/users');
    });

    it('should handle nested endpoints', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('users/123/profile')).toBe(
        'https://api.example.com/users/123/profile'
      );
    });

    it('should handle endpoint with query parameters', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('users?page=1&limit=10')).toBe(
        'https://api.example.com/users?page=1&limit=10'
      );
    });
  });

  describe('without base URL configured', () => {
    it('should return endpoint with leading slash when base URL is empty', () => {
      process.env.REACT_APP_MOCKOON_URL = '';
      expect(urlBuilder.build('users')).toBe('/users');
    });

    it('should return endpoint with leading slash when base URL is undefined', () => {
      delete process.env.REACT_APP_MOCKOON_URL;
      expect(urlBuilder.build('users')).toBe('/users');
    });

    it('should handle endpoint with leading slash when base URL is empty', () => {
      process.env.REACT_APP_MOCKOON_URL = '';
      expect(urlBuilder.build('/users')).toBe('/users');
    });

    it('should handle nested endpoints without base URL', () => {
      process.env.REACT_APP_MOCKOON_URL = '';
      expect(urlBuilder.build('users/123/profile')).toBe('/users/123/profile');
    });

    it('should handle endpoint with query parameters without base URL', () => {
      process.env.REACT_APP_MOCKOON_URL = '';
      expect(urlBuilder.build('users?page=1')).toBe('/users?page=1');
    });

    it('should return normalized endpoint when base URL is whitespace only', () => {
      process.env.REACT_APP_MOCKOON_URL = '   ';
      expect(urlBuilder.build('users')).toBe('/users');
    });
  });

  describe('edge cases', () => {
    it('should handle empty endpoint', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('')).toBe('https://api.example.com/');
    });

    it('should handle empty endpoint without base URL', () => {
      process.env.REACT_APP_MOCKOON_URL = '';
      expect(urlBuilder.build('')).toBe('/');
    });

    it('should handle endpoint with only slash', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com';
      expect(urlBuilder.build('/')).toBe('https://api.example.com/');
    });

    it('should handle base URL with path', () => {
      process.env.REACT_APP_MOCKOON_URL = 'https://api.example.com/v1/api';
      expect(urlBuilder.build('users')).toBe('https://api.example.com/v1/api/users');
    });

    it('should handle localhost URL', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080';
      expect(urlBuilder.build('users')).toBe('http://localhost:8080/users');
    });
  });
});
