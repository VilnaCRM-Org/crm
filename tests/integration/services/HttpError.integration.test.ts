import { HttpError } from '@/services/HttpsClient/HttpError';

describe('HttpError integration', () => {
  it('uses captureStackTrace when available', () => {
    const error = new HttpError({ status: 500, message: 'Server error' });
    expect(error.status).toBe(500);
    expect(error.name).toBe('HttpError');
    expect(error.stack).toBeDefined();
  });

  it('still constructs when captureStackTrace is missing', () => {
    const originalCapture = (Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace })
      .captureStackTrace;
    // Simulate environment without captureStackTrace
    (Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace }).captureStackTrace =
      undefined;

    try {
      const error = new HttpError({ status: 400, message: 'Bad request', cause: 'cause' });
      expect(error.status).toBe(400);
      expect(error.cause).toBe('cause');
      expect(error.stack).toBeDefined();
    } finally {
      (Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace }).captureStackTrace =
        originalCapture;
    }
  });
});
