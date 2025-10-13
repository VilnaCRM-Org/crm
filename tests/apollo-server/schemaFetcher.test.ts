jest.mock('node:fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

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

let fsPromises: { mkdir: jest.Mock; writeFile: jest.Mock };

interface SchemaFetcherModule {
  fetchAndSaveSchema: (outputDir: string) => Promise<void>;
  handleFatalError: (error: Error, outputDir?: string) => never;
  getLogger: (outputDir?: string) => { info: jest.Mock; error: jest.Mock };
}

function getSchemaFetcherModule(): SchemaFetcherModule {
  return require('../../docker/apollo-server/lib/schemaFetcher') as SchemaFetcherModule;
}

function getFetchAndSaveSchema(): (outputDir: string) => Promise<void> {
  return getSchemaFetcherModule().fetchAndSaveSchema;
}

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jest.useFakeTimers();

  fsPromises = require('node:fs').promises;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('schemaFetcher', () => {
  const originalEnv = { ...process.env };
  const TEST_DIR = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment but keep structure
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
  });

  describe('missing GRAPHQL_SCHEMA_URL', () => {
    it('should skip fetch when GRAPHQL_SCHEMA_URL is not set in development', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'development';

      await getFetchAndSaveSchema()(TEST_DIR);

      expect(fetch).not.toHaveBeenCalled();
    }, 10000);

    it('should throw error when GRAPHQL_SCHEMA_URL is not set in production', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'production';

      await expect(getFetchAndSaveSchema()(TEST_DIR)).rejects.toThrow(
        'GRAPHQL_SCHEMA_URL is required in production environment'
      );
    }, 10000);

    it('should skip fetch when GRAPHQL_SCHEMA_URL is empty string', async () => {
      process.env.GRAPHQL_SCHEMA_URL = '';
      process.env.NODE_ENV = 'development';

      await getFetchAndSaveSchema()(TEST_DIR);

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

      await getFetchAndSaveSchema()(TEST_DIR);

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

      await getFetchAndSaveSchema()(TEST_DIR);

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should throw error for non-EEXIST directory creation error', async () => {
      process.env.NODE_ENV = 'production';
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      const dirError = new Error('Permission denied') as NodeJS.ErrnoException;
      dirError.code = 'EACCES';
      (fsPromises.mkdir as jest.Mock).mockRejectedValue(dirError);

      const p = getFetchAndSaveSchema()(TEST_DIR);
      const timerPromise = jest.runAllTimersAsync();
      await expect(p).rejects.toThrow('Permission denied');
      await timerPromise;
    }, 10000);

    it('should throw error when directory creation fails without code property', async () => {
      process.env.NODE_ENV = 'production';
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      const dirError = new Error('Unknown filesystem error');
      (fsPromises.mkdir as jest.Mock).mockRejectedValue(dirError);

      const p = getFetchAndSaveSchema()(TEST_DIR);
      const timerPromise = jest.runAllTimersAsync();
      await expect(p).rejects.toThrow('Unknown filesystem error');
      await timerPromise;
    }, 10000);

    it('should throw error when directory creation fails with null error', async () => {
      process.env.NODE_ENV = 'production';
      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      (fsPromises.mkdir as jest.Mock).mockRejectedValue(null);

      const p = getFetchAndSaveSchema()(TEST_DIR);
      const timerPromise = jest.runAllTimersAsync();
      await expect(p).rejects.toThrow();
      await timerPromise;
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

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3); // Default MAX_RETRIES
    }, 15000);

    it('should handle fetch timeout', async () => {
      process.env.GRAPHQL_TIMEOUT_MS = '100';

      (fetch as jest.Mock).mockImplementation(
        (_url, opts: { signal?: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            const onAbort = (): void => {
              const err = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            };
            opts?.signal?.addEventListener('abort', onAbort, { once: true });
          })
      );

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 20000);

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should handle non-Error thrown from fetch', async () => {
      (fetch as jest.Mock).mockRejectedValue('String error from fetch');

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

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

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should respect MAX_RETRIES configuration', async () => {
      process.env.GRAPHQL_MAX_RETRIES = '2';
      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('configuration', () => {
    it('should use custom MAX_RETRIES', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.GRAPHQL_MAX_RETRIES = '5';
      process.env.NODE_ENV = 'development';

      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(5);
    }, 30000);

    it('should use default MAX_RETRIES when not set', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';
      delete process.env.GRAPHQL_MAX_RETRIES;

      (fetch as jest.Mock).mockRejectedValue(new Error('Failure'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should use custom TIMEOUT_MS', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.GRAPHQL_TIMEOUT_MS = '1000';

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('schema'),
      });

      await getFetchAndSaveSchema()(TEST_DIR);

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

      const p = getFetchAndSaveSchema()(TEST_DIR);
      const timerPromise = jest.runAllTimersAsync();
      await expect(p).rejects.toThrow('Network error');
      await timerPromise;
    }, 15000);

    it('should not throw in development after retries', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';
      process.env.NODE_ENV = 'development';

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await expect(p).resolves.toBeUndefined();
    }, 15000);

    it('should require GRAPHQL_SCHEMA_URL in production', async () => {
      delete process.env.GRAPHQL_SCHEMA_URL;
      process.env.NODE_ENV = 'production';

      await expect(getFetchAndSaveSchema()(TEST_DIR)).rejects.toThrow(
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

      await getFetchAndSaveSchema()(TEST_DIR);

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

      const p = getFetchAndSaveSchema()(TEST_DIR);
      // Run all pending timers to complete all retries
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);

    it('should handle non-AbortError', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Generic error'));

      const p = getFetchAndSaveSchema()(TEST_DIR);
      await jest.runAllTimersAsync();
      await p;

      expect(fetch).toHaveBeenCalledTimes(3);
    }, 15000);
  });

  describe('logger caching', () => {
    it('should reuse logger instance on subsequent calls', async () => {
      process.env.GRAPHQL_SCHEMA_URL = 'http://example.com/schema.graphql';

      const mockSchema = 'type Query { hello: String }';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockSchema),
      });

      // First call creates the logger
      await getFetchAndSaveSchema()(TEST_DIR);
      const firstCallCount = jest.mocked(require('winston').createLogger).mock.calls.length;

      // Second call should reuse the logger
      await getFetchAndSaveSchema()(TEST_DIR);
      const secondCallCount = jest.mocked(require('winston').createLogger).mock.calls.length;

      // Logger should only be created once
      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should create logger without outputDir and use process.cwd()', () => {
      const { getLogger } = getSchemaFetcherModule();
      const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/default/path');

      delete process.env.GRAPHQL_LOG_FILE;

      const logger = getLogger();

      expect(logger).toBeDefined();
      expect(cwdSpy).toHaveBeenCalled();

      cwdSpy.mockRestore();
    });

    it('should use custom log level from GRAPHQL_LOG_LEVEL env variable', () => {
      jest.resetModules(); // Reset to clear cached logger
      process.env.GRAPHQL_LOG_LEVEL = 'debug';

      const { getLogger } = require('../../docker/apollo-server/lib/schemaFetcher');
      const logger = getLogger(TEST_DIR);

      expect(logger).toBeDefined();
      // Verify logger was created with the custom log level
      const winston = require('winston');
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        })
      );
    });

    it('should use default log level when GRAPHQL_LOG_LEVEL is not set', () => {
      jest.resetModules(); // Reset to clear cached logger
      delete process.env.GRAPHQL_LOG_LEVEL;

      const { getLogger } = require('../../docker/apollo-server/lib/schemaFetcher');
      const logger = getLogger(TEST_DIR);

      expect(logger).toBeDefined();
      // Verify logger was created with the default log level 'info'
      const winston = require('winston');
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );
    });

    it('should handle File transport initialization failure with Error', () => {
      jest.resetModules();
      jest.clearAllMocks();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockConsoleTransport = jest.fn();
      const mockFileTransport = jest.fn(() => {
        throw new Error('File transport initialization failed');
      });

      jest.doMock('winston', () => ({
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
          Console: mockConsoleTransport,
          File: mockFileTransport,
        },
      }));

      const { getLogger } = require('../../docker/apollo-server/lib/schemaFetcher');

      const logger = getLogger(TEST_DIR);

      expect(logger).toBeDefined();
      expect(mockFileTransport).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Logger file transport could not be initialized (File transport initialization failed), using console only.'
      );

      consoleWarnSpy.mockRestore();
      jest.dontMock('winston');
    });

    it('should handle File transport initialization failure with non-Error value', () => {
      jest.resetModules();
      jest.clearAllMocks();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockConsoleTransport = jest.fn();
      const mockFileTransport = jest.fn(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error message';
      });

      jest.doMock('winston', () => ({
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
          Console: mockConsoleTransport,
          File: mockFileTransport,
        },
      }));

      const { getLogger } = require('../../docker/apollo-server/lib/schemaFetcher');

      const logger = getLogger(TEST_DIR);

      expect(logger).toBeDefined();
      expect(mockFileTransport).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Logger file transport could not be initialized (String error message), using console only.'
      );

      consoleWarnSpy.mockRestore();
      jest.dontMock('winston');
    });
  });

  describe('handleFatalError', () => {
    let processExitSpy: jest.SpyInstance<
      never,
      [code?: string | number | null | undefined],
      unknown
    >;

    beforeEach(() => {
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((
        code?: string | number | null | undefined
      ) => {
        throw new Error(`process.exit called with code ${code}`);
      }) as (code?: string | number | null | undefined) => never);
    });

    afterEach(() => {
      processExitSpy.mockRestore();
    });

    it('should log error and exit with code 1', () => {
      const testError = new Error('Fatal network error');
      const { handleFatalError } = getSchemaFetcherModule();

      expect(() => {
        handleFatalError(testError, TEST_DIR);
      }).toThrow('process.exit called');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle different error types', () => {
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';

      const { handleFatalError } = getSchemaFetcherModule();

      expect(() => {
        handleFatalError(networkError, TEST_DIR);
      }).toThrow('process.exit called');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should call handleFatalError without outputDir', () => {
      const testError = new Error('Test error');
      const { handleFatalError } = getSchemaFetcherModule();

      expect(() => {
        handleFatalError(testError);
      }).toThrow('process.exit called');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
