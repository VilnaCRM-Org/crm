import { promises as fsPromises } from 'node:fs';

import { fetchAndSaveSchema } from '../../docker/apollo-server/schemaFetcher.test-src';

// Mock dependencies BEFORE importing the module
jest.mock('node:fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Don't mock dotenv - we'll control env vars directly
jest.mock('dotenv', () => {
  const actualDotenv = jest.requireActual('dotenv');
  return {
    ...actualDotenv,
    config: jest.fn(() => ({ parsed: {} })),
  };
});

jest.mock('dotenv-expand', () => {
  const actualExpand = jest.requireActual('dotenv-expand');
  return {
    ...actualExpand,
    expand: jest.fn(),
  };
});

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe.skip('schemaFetcher', () => {
  const originalEnv = { ...process.env };
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Reset environment but keep structure
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllTimers();
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
    consoleLogSpy.mockRestore();
  });

  describe('missing GRAPHQL_SCHEMA_URL', () => {
    it('should skip fetch when GRAPHQL_SCHEMA_URL is not set in development', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'development';

      await fetchAndSaveSchema();

      expect(fetch).not.toHaveBeenCalled();
    }, 10000);

    it('should throw error when GRAPHQL_SCHEMA_URL is not set in production', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'production';

      await expect(fetchAndSaveSchema()).rejects.toThrow(
        'GRAPHQL_SCHEMA_URL is required in production environment'
      );
    }, 10000);

    it('should skip fetch when GRAPHQL_SCHEMA_URL is empty string', async () => {
      process.env.GRAPHQL_SCHEMA_URL = '';
      process.env.NODE_ENV = 'development';

      await fetchAndSaveSchema();

      expect(fetch).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('successful schema fetch', () => {
    beforeEach(() => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
    });

    it('should fetch and save schema successfully', async () => {
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledWith(
        'http://example.com/schema.graphql',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: {
            'User-Agent': 'GraphQL/SchemaFetcher',
            Accept: 'text/plain, application/graphql, application/json;q=0.9, */*;q=0.8',
          },
        })
      );
      expect(fsPromises.mkdir).toHaveBeenCalled();
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('schema.graphql'),
        mockSchema,
        'utf-8'
      );
    });

    it('should handle existing directory gracefully', async () => {
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      const dirError = new Error('Directory exists') as Error & { code: 'EEXIST' };
      dirError.code = 'EEXIST';
      (fsPromises.mkdir as jest.Mock).mockRejectedValueOnce(dirError);

      await fetchAndSaveSchema();

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should throw error for non-EEXIST directory creation error', async () => {
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      const dirError = new Error('Permission denied') as NodeJS.ErrnoException;
      dirError.code = 'EACCES';
      (fsPromises.mkdir as jest.Mock).mockRejectedValueOnce(dirError);

      await expect(fetchAndSaveSchema()).rejects.toThrow('Permission denied');
    }, 10000);
  });

  describe('fetch failures', () => {
    beforeEach(() => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';
    });

    it('should handle non-ok response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(3); // Default MAX_RETRIES
    }, 15000);

    it('should handle fetch timeout', async () => {
      process.env.GRAPHQL_TIMEOUT_MS = '100';

      (fetch as jest.Mock).mockImplementation(() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 50);
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 200);
        });
      });

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalled();
    }, 20000);

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('retry logic', () => {
    beforeEach(() => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';
    });

    it('should retry failed requests', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue('schema'),
        });

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should respect MAX_RETRIES configuration', async () => {
      process.env.GRAPHQL_MAX_RETRIES = '2';
      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('configuration', () => {
    it('should use custom MAX_RETRIES', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.GRAPHQL_MAX_RETRIES = '5';
      process.env.NODE_ENV = 'development';

      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(5);
    }, 30000);

    it('should use default MAX_RETRIES when not set', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';
      delete process.env.GRAPHQL_MAX_RETRIES;

      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should use custom TIMEOUT_MS', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.GRAPHQL_TIMEOUT_MS = '1000';

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('schema'),
      });

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe('production environment', () => {
    it('should throw error after all retries in production', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'production';

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(fetchAndSaveSchema()).rejects.toThrow('Network error');
    }, 15000);

    it('should not throw in development after retries', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(fetchAndSaveSchema()).resolves.toBeUndefined();
    }, 15000);

    it('should require GRAPHQL_SCHEMA_URL in production', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'production';

      await expect(fetchAndSaveSchema()).rejects.toThrow(
        'GRAPHQL_SCHEMA_URL is required in production environment'
      );
    }, 10000);
  });

  describe('timeout handling', () => {
    it('should clear timeout on successful fetch', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('schema'),
      });

      await fetchAndSaveSchema();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('error messages', () => {
    beforeEach(() => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';
    });

    it('should handle AbortError specially', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      (fetch as jest.Mock).mockRejectedValue(abortError);

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalled();
    }, 15000);

    it('should handle non-AbortError', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Generic error'));

      await fetchAndSaveSchema();

      expect(fetch).toHaveBeenCalled();
    }, 15000);
  });
});
