import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type DetectorModule = typeof import('@/lib/reliability/recovery-strategy-detector');

// The recovery table is a module-level literal, so the module is loaded inside each test to keep
// a mutant in it reachable by an assertion (issue #171).
const loadDetector = (): Promise<DetectorModule> =>
  loadIsolated(() => import('@/lib/reliability/recovery-strategy-detector'));

const RETRYABLE: RecoverableError = {
  recoverable: true,
  strategy: 'retry',
  messageKey: 'error_boundary.retryable',
  severity: 'error',
};

const UNRECOVERABLE: RecoverableError = {
  recoverable: false,
  strategy: 'none',
  messageKey: 'error_boundary.unrecoverable',
  severity: 'error',
};

const CHUNK_LOAD: RecoverableError = {
  recoverable: true,
  strategy: 'reload',
  messageKey: 'error_boundary.chunk_load',
  severity: 'error',
};

const ROUTE: RecoverableError = {
  recoverable: true,
  strategy: 'navigate-home',
  messageKey: 'error_boundary.route',
  severity: 'warning',
};

const UNEXPECTED: RecoverableError = {
  recoverable: true,
  strategy: 'reset',
  messageKey: 'error_boundary.unexpected',
  severity: 'error',
};

const buildRecoverable = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  recoverable: false,
  strategy: 'none',
  messageKey: 'error_boundary.unrecoverable',
  severity: 'fatal',
  ...overrides,
});

const buildRouteResponse = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  status: 404,
  statusText: 'Not Found',
  data: null,
  ...overrides,
});

describe('RecoveryStrategyDetector', () => {
  it('exports the detector as a module singleton', async () => {
    const { default: detector, RecoveryStrategyDetector } = await loadDetector();

    expect(detector).toBeInstanceOf(RecoveryStrategyDetector);
  });

  it('pins the literal recovery table keyed by rule', async () => {
    const { RECOVERIES } = await loadDetector();

    expect(RECOVERIES).toEqual({
      retryable: RETRYABLE,
      unrecoverable: UNRECOVERABLE,
      chunkLoad: CHUNK_LOAD,
      route: ROUTE,
      unexpected: UNEXPECTED,
    });
  });

  describe('rule 1 — a RecoverableError is returned as it is', () => {
    it('returns the very same object', async () => {
      const { default: detector } = await loadDetector();
      const error = buildRecoverable();

      expect(detector.classify(error)).toBe(error);
    });

    it('wins over the retryable flag carried by the same object', async () => {
      const { default: detector } = await loadDetector();
      const error = buildRecoverable({ retryable: true });

      expect(detector.classify(error)).toBe(error);
    });
  });

  describe('rule 2 — the retryable flag of a UiError / AuthError shape', () => {
    it('maps retryable: true to the retry recovery', async () => {
      const { default: detector } = await loadDetector();

      expect(detector.classify({ kind: 'network', retryable: true })).toEqual(RETRYABLE);
    });

    it('maps retryable: false to the no-recovery outcome', async () => {
      const { default: detector } = await loadDetector();

      expect(detector.classify({ code: 'JS_ERROR', retryable: false })).toEqual(UNRECOVERABLE);
    });

    it('hands out the table entry itself rather than a copy', async () => {
      const { default: detector, RECOVERIES } = await loadDetector();

      expect(detector.classify({ retryable: true })).toBe(RECOVERIES.retryable);
      expect(detector.classify({ retryable: false })).toBe(RECOVERIES.unrecoverable);
    });

    it.each(['yes', 1, undefined, null])(
      'ignores a retryable flag of %p and falls through',
      async (retryable) => {
        const { default: detector } = await loadDetector();
        const error = { retryable };

        expect(detector.classify(error)).toEqual({ ...UNEXPECTED, cause: error });
      }
    );

    it('wins over a chunk-load error that also carries the flag', async () => {
      const { default: detector } = await loadDetector();
      const error = Object.assign(new Error('Loading chunk 1 failed.'), { retryable: false });

      expect(detector.classify(error)).toEqual(UNRECOVERABLE);
    });
  });

  describe('rule 3 — a chunk-load failure', () => {
    it('maps a ChunkLoadError to the reload recovery', async () => {
      const { default: detector } = await loadDetector();
      const error = Object.assign(new Error('Loading chunk 5 failed.'), {
        name: 'ChunkLoadError',
      });

      expect(detector.classify(error)).toEqual(CHUNK_LOAD);
    });

    it('maps a dynamic-import failure recognized by message alone', async () => {
      const { default: detector } = await loadDetector();
      const error = new TypeError('Failed to fetch dynamically imported module: /static/js/x.js');

      expect(detector.classify(error)).toEqual(CHUNK_LOAD);
    });

    it('wins over a route-response shape carried by the same object', async () => {
      const { default: detector } = await loadDetector();
      const error = Object.assign(new Error('Loading CSS chunk 2 failed.'), buildRouteResponse());

      expect(detector.classify(error)).toEqual(CHUNK_LOAD);
    });
  });

  describe('rule 4 — a router error response', () => {
    it('maps a route error response to the navigate-home recovery', async () => {
      const { default: detector } = await loadDetector();

      expect(detector.classify(buildRouteResponse())).toEqual(ROUTE);
    });

    it('accepts the full react-router ErrorResponse shape', async () => {
      const { default: detector } = await loadDetector();
      const response = buildRouteResponse({ status: 500, data: { message: buildToken() } });

      expect(detector.classify({ ...response, internal: true, error: new Error() })).toEqual(ROUTE);
    });

    it('accepts data that is present but undefined', async () => {
      const { default: detector } = await loadDetector();

      expect(detector.classify(buildRouteResponse({ data: undefined }))).toEqual(ROUTE);
    });

    it.each([
      ['a missing status', { status: undefined }],
      ['a status that is not a number', { status: '404' }],
      ['a missing statusText', { statusText: undefined }],
      ['a statusText that is not a string', { statusText: 404 }],
    ])('falls through on %s', async (_, overrides) => {
      const { default: detector } = await loadDetector();
      const error = buildRouteResponse(overrides);

      expect(detector.classify(error)).toEqual({ ...UNEXPECTED, cause: error });
    });

    it('falls through when the data field is absent altogether', async () => {
      const { default: detector } = await loadDetector();
      const error = { status: 404, statusText: 'Not Found' };

      expect(detector.classify(error)).toEqual({ ...UNEXPECTED, cause: error });
    });
  });

  describe('rule 5 — everything else', () => {
    it('maps a plain Error to the reset recovery and keeps it as the cause', async () => {
      const { default: detector } = await loadDetector();
      const error = new Error(buildToken());

      const recovery = detector.classify(error);

      expect(recovery).toEqual({ ...UNEXPECTED, cause: error });
      expect(recovery.cause).toBe(error);
    });

    it.each([undefined, null, 'boom', 42, true])(
      'maps the non-object value %p to the reset recovery',
      async (value) => {
        const { default: detector } = await loadDetector();

        expect(detector.classify(value)).toEqual({ ...UNEXPECTED, cause: value });
      }
    );

    it('maps an object of no recognized shape', async () => {
      const { default: detector } = await loadDetector();
      const error = { message: buildToken() };

      expect(detector.classify(error)).toEqual({ ...UNEXPECTED, cause: error });
    });

    it('builds a fresh result per call so the cause cannot leak between errors', async () => {
      const { default: detector } = await loadDetector();

      const first = detector.classify(new Error('first'));
      const second = detector.classify(new Error('second'));

      expect(first).not.toBe(second);
      expect(first.cause).not.toBe(second.cause);
    });
  });
});
