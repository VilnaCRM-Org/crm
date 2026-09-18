import { HttpError } from '@/services/https-client/http-error';
import type TransientErrorDetector from '@/services/resilience/transient-error-detector';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type DetectorModule = typeof import('@/services/resilience/transient-error-detector');

// The status table is a module-level literal, so the module is loaded inside each test to keep a
// mutant in it reachable by an assertion (issue #171).
const loadDetector = async (): Promise<TransientErrorDetector> => {
  const { default: Detector } = await loadIsolated<DetectorModule>(
    () => import('@/services/resilience/transient-error-detector')
  );
  return new Detector();
};

describe('TransientErrorDetector', () => {
  it.each([0, 408, 500, 502, 503, 504])(
    'treats an HttpError with status %i as transient',
    async (status) => {
      const detector = await loadDetector();

      expect(detector.is(new HttpError({ status, message: buildToken() }))).toBe(true);
    }
  );

  it.each([400, 401, 403, 404, 409, 422, 429, 501, 505])(
    'does not retry an HttpError with status %i',
    async (status) => {
      const detector = await loadDetector();

      expect(detector.is(new HttpError({ status, message: buildToken() }))).toBe(false);
    }
  );

  it('accepts a status-shaped plain object that is not an HttpError instance', async () => {
    const detector = await loadDetector();

    expect(detector.is({ status: 503 })).toBe(true);
    expect(detector.is({ status: 404 })).toBe(false);
  });

  it('never retries a caller abort, even when it carries a transient status', async () => {
    const detector = await loadDetector();
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError', status: 0 });

    expect(detector.is(abort)).toBe(false);
  });

  it('rejects a status that is not a number', async () => {
    const detector = await loadDetector();

    expect(detector.is({ status: '503' })).toBe(false);
    expect(detector.is({ name: 'HttpError' })).toBe(false);
    expect(detector.is(new Error(buildToken()))).toBe(false);
  });

  it.each([undefined, null, 503, 'Network error', true])(
    'rejects the non-object value %p',
    async (value) => {
      const detector = await loadDetector();

      expect(detector.is(value)).toBe(false);
    }
  );
});
