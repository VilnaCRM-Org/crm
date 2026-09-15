import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type DetectorModule = typeof import('@/lib/reliability/chunk-load-error-detector');

// The message-fragment table is a module-level literal, so the module is loaded inside each test
// to keep a mutant in it reachable by an assertion (issue #171).
const loadDetector = (): Promise<DetectorModule> =>
  loadIsolated(() => import('@/lib/reliability/chunk-load-error-detector'));

describe('ChunkLoadErrorDetector', () => {
  it('exports the detector as a module singleton', async () => {
    const { default: detector, ChunkLoadErrorDetector } = await loadDetector();

    expect(detector).toBeInstanceOf(ChunkLoadErrorDetector);
  });

  it('recognizes an error named ChunkLoadError whatever its message says', async () => {
    const { default: detector } = await loadDetector();
    const error = Object.assign(new Error(buildToken()), { name: 'ChunkLoadError' });

    expect(detector.is(error)).toBe(true);
  });

  it.each([
    'Loading chunk 123 failed.',
    'Loading CSS chunk 42 failed.',
    'Failed to fetch dynamically imported module: https://crm.example/static/js/page.js',
  ])('recognizes the bundler message %s under any error name', async (message) => {
    const { default: detector } = await loadDetector();

    expect(detector.is(new TypeError(message))).toBe(true);
  });

  it('matches the message fragments case-insensitively', async () => {
    const { default: detector } = await loadDetector();

    expect(detector.is(new Error('LOADING CHUNK 7 FAILED.'))).toBe(true);
  });

  it('recognizes a chunk-shaped plain object that is not an Error instance', async () => {
    const { default: detector } = await loadDetector();

    expect(detector.is({ name: 'TypeError', message: 'Loading chunk 9 failed.' })).toBe(true);
    expect(detector.is({ name: 'ChunkLoadError' })).toBe(true);
  });

  it('does not treat a generic fetch failure as a chunk-load failure', async () => {
    const { default: detector } = await loadDetector();

    expect(detector.is(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('ignores an error whose name and message are unrelated', async () => {
    const { default: detector } = await loadDetector();

    expect(detector.is(new Error(buildToken()))).toBe(false);
  });

  it.each([undefined, null, 'Loading chunk 1 failed.', 7, true])(
    'rejects the non-object value %p',
    async (value) => {
      const { default: detector } = await loadDetector();

      expect(detector.is(value)).toBe(false);
    }
  );

  it('rejects an object whose message is not a string', async () => {
    const { default: detector } = await loadDetector();

    expect(detector.is({ name: 'TypeError', message: ['Loading chunk 1 failed.'] })).toBe(false);
    expect(detector.is({ name: 'TypeError' })).toBe(false);
  });
});
