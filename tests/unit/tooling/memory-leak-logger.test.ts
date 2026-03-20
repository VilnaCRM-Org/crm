// @jest-environment node

describe('memory leak logger', () => {
  it('preserves extra context arguments when logging errors', () => {
    jest.isolateModules(() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const logger = require('../../memory-leak/utils/logger.js');
      const error = new Error('boom');

      logger.error('Failure', error, { phase: 'setup' }, 42);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failure',
        expect.stringContaining('Error: boom'),
        { phase: 'setup' },
        42
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
