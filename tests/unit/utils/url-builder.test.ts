import urlBuilder from '@/utils/url-builder';

describe('buildApiUrl', () => {
  const originalEnv = process.env.REACT_APP_MOCKOON_URL;

  afterEach(() => {
    process.env.REACT_APP_MOCKOON_URL = originalEnv;
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
