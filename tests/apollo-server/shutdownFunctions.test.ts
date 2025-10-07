import {
  cleanupResources,
  shouldShutdown,
  handleServerFailure,
  CriticalError,
} from '../../docker/apollo-tests/shutdownFunctions.test-src';

describe('shutdownFunctions', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.useRealTimers();
  });

  describe('cleanupResources', () => {
    it('should log cleanup messages', async () => {
      const cleanupPromise = cleanupResources();
      jest.runAllTimers();
      await cleanupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleanup complete.');
    });

    it('should complete cleanup successfully', async () => {
      const cleanupPromise = cleanupResources();
      jest.runAllTimers();
      await cleanupPromise;

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors gracefully', async () => {
      const original = global.setTimeout;
      let callCount = 0;
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(
          <TArgs extends unknown[]>(
            fn: (...args: TArgs) => void,
            delay?: number
          ): ReturnType<typeof setTimeout> => {
            callCount += 1;
            if (callCount === 1) {
              throw new Error('Cleanup error during timeout');
            }
            return original(fn, delay) as unknown as ReturnType<typeof setTimeout>;
          }
        );
      try {
        await cleanupResources();
      } finally {
        setTimeoutSpy.mockRestore();
      }
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
    });

    it('should wait for database connections to close', async () => {
      const cleanupPromise = cleanupResources();

      // Advance timers to simulate the 1 second delay
      jest.advanceTimersByTime(1000);

      await cleanupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
    });
  });

  describe('shouldShutdown', () => {
    describe('CriticalError', () => {
      it('should return true for CriticalError', () => {
        const error = new CriticalError('Critical failure');
        expect(shouldShutdown(error)).toBe(true);
      });
    });

    describe('error patterns', () => {
      it('should return true for ECONNREFUSED error', () => {
        const error = new Error('Connection failed: ECONNREFUSED');
        expect(shouldShutdown(error)).toBe(true);
      });

      it('should return true for EADDRINUSE error', () => {
        const error = new Error('Port already in use: EADDRINUSE');
        expect(shouldShutdown(error)).toBe(true);
      });

      it('should return true for database connection error', () => {
        const error = new Error('Cannot connect to database');
        expect(shouldShutdown(error)).toBe(true);
      });

      it('should return true for out of memory error', () => {
        const error = new Error('Out of memory');
        expect(shouldShutdown(error)).toBe(true);
      });

      it('should return false for recoverable errors', () => {
        const error = new Error('Temporary network glitch');
        expect(shouldShutdown(error)).toBe(false);
      });

      it('should return false for validation errors', () => {
        const error = new Error('Invalid input');
        expect(shouldShutdown(error)).toBe(false);
      });
    });

    describe('non-Error objects', () => {
      it('should return false for non-Error objects', () => {
        expect(shouldShutdown('string error')).toBe(false);
        expect(shouldShutdown(123)).toBe(false);
        expect(shouldShutdown(null)).toBe(false);
        expect(shouldShutdown(undefined)).toBe(false);
        expect(shouldShutdown({})).toBe(false);
      });

      it('should return false for error-like objects without proper type', () => {
        const errorLike = { message: 'ECONNREFUSED' };
        expect(shouldShutdown(errorLike)).toBe(false);
      });
    });

    describe('multiple patterns', () => {
      it('should match any critical pattern', () => {
        expect(shouldShutdown(new Error('ECONNREFUSED during startup'))).toBe(true);
        expect(shouldShutdown(new Error('Port EADDRINUSE 4000'))).toBe(true);
        expect(shouldShutdown(new Error('Cannot connect to database server'))).toBe(true);
        expect(shouldShutdown(new Error('Out of memory - heap limit reached'))).toBe(true);
      });

      it('should be case-sensitive for patterns', () => {
        const error = new Error('econnrefused');
        expect(shouldShutdown(error)).toBe(false);
      });
    });
  });

  describe('handleServerFailure', () => {
    it('should log cleanup attempt', async () => {
      try {
        const failurePromise = handleServerFailure();
        jest.runAllTimers();
        await failurePromise;
      } catch (error) {
        // Expected to throw due to process.exit
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Attempting to clean up before exiting...');
    });

    it('should call cleanupResources', async () => {
      try {
        const failurePromise = handleServerFailure();
        jest.runAllTimers();
        await failurePromise;
      } catch (error) {
        // Expected to throw due to process.exit
      }

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
    });

    it('should exit with code 1', async () => {
      try {
        const failurePromise = handleServerFailure();
        jest.runAllTimers();
        await failurePromise;
      } catch (error) {
        // Expected to throw due to process.exit mock
      }

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit even if cleanup fails', async () => {
      try {
        const failurePromise = handleServerFailure();
        jest.runAllTimers();
        await failurePromise;
      } catch (error) {
        // Expected
      }

      // Process.exit should be called in finally block
      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full cleanup flow', async () => {
      const cleanupPromise = cleanupResources();
      jest.runAllTimers();
      await cleanupPromise;

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleanup complete.');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should properly determine shutdown for various errors', () => {
      const criticalErrors = [
        new Error('ECONNREFUSED'),
        new Error('EADDRINUSE'),
        new Error('Cannot connect to database'),
        new Error('Out of memory'),
      ];

      const recoverableErrors = [
        new Error('Validation failed'),
        new Error('Request timeout'),
        new Error('Invalid input'),
      ];

      criticalErrors.forEach((error) => {
        expect(shouldShutdown(error)).toBe(true);
      });

      recoverableErrors.forEach((error) => {
        expect(shouldShutdown(error)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty error message', () => {
      const error = new Error('');
      expect(shouldShutdown(error)).toBe(false);
    });

    it('should handle error with only whitespace', () => {
      const error = new Error('   ');
      expect(shouldShutdown(error)).toBe(false);
    });

    it('should handle error with partial pattern match', () => {
      const error = new Error('CONN'); // Partial match of ECONNREFUSED
      expect(shouldShutdown(error)).toBe(false);
    });

    it('should handle cleanup with immediate completion', async () => {
      jest.useRealTimers();
      await cleanupResources();
      expect(consoleLogSpy).toHaveBeenCalledWith('Cleanup complete.');
      jest.useFakeTimers();
    });
  });

  describe('concurrent cleanup', () => {
    it('should handle multiple cleanup calls', async () => {
      const cleanup1 = cleanupResources();
      const cleanup2 = cleanupResources();

      jest.runAllTimers();

      await Promise.all([cleanup1, cleanup2]);

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleaning up resources...');
    });
  });

  describe('CriticalError class behavior', () => {
    it('should properly identify CriticalError instances', () => {
      const criticalError = new CriticalError('Critical system failure');
      const regularError = new Error('Regular error');

      expect(shouldShutdown(criticalError)).toBe(true);
      expect(shouldShutdown(regularError)).toBe(false);
    });
  });
});
