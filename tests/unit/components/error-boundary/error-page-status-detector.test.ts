import { data } from 'react-router';

import type { ErrorPageVariantId } from '@/components/types/error-page';
import loadIsolated from '@tests/unit/utils/isolated-module';

type DetectorModule = typeof import('@/components/error-boundary/error-page-status-detector');

const loadDetector = (): Promise<DetectorModule> =>
  loadIsolated(() => import('@/components/error-boundary/error-page-status-detector'));

const detect = async (routeError: unknown): Promise<ErrorPageVariantId | null> => {
  const { default: detector } = await loadDetector();
  return detector.detect(routeError);
};

const buildRouteResponse = (status: number): Record<string, unknown> => ({
  status,
  statusText: '',
  internal: false,
  data: null,
});

const MAPPED_STATUSES: ReadonlyArray<readonly [number, ErrorPageVariantId]> = [
  [403, 'forbidden'],
  [404, 'notFound'],
  [500, 'serverError'],
  [503, 'serverError'],
  [599, 'serverError'],
];

const UNMAPPED_STATUSES: readonly number[] = [399, 400, 401, 405, 499];

const buildChunkLoadError = (): Error =>
  Object.assign(new Error('Loading chunk 7 failed.'), { name: 'ChunkLoadError' });

describe('ErrorPageStatusDetector', () => {
  it('exports the detector as a module singleton', async () => {
    const { default: detector, ErrorPageStatusDetector } = await loadDetector();

    expect(detector).toBeInstanceOf(ErrorPageStatusDetector);
  });

  describe('a router error response', () => {
    it.each(MAPPED_STATUSES)('maps status %i to %s', async (status, variant) => {
      await expect(detect(buildRouteResponse(status))).resolves.toBe(variant);
    });

    it.each([...UNMAPPED_STATUSES, 600])('maps status %i to no page', async (status) => {
      await expect(detect(buildRouteResponse(status))).resolves.toBeNull();
    });
  });

  describe('a thrown Response', () => {
    it.each(MAPPED_STATUSES)('maps status %i to %s', async (status, variant) => {
      await expect(detect(new Response(null, { status }))).resolves.toBe(variant);
    });

    it.each(UNMAPPED_STATUSES)('maps status %i to no page', async (status) => {
      await expect(detect(new Response(null, { status }))).resolves.toBeNull();
    });
  });

  describe('a data() value', () => {
    it.each(MAPPED_STATUSES)('maps a numeric status %i to %s', async (status, variant) => {
      await expect(detect(data(null, status))).resolves.toBe(variant);
    });

    it.each(MAPPED_STATUSES)('maps an init status %i to %s', async (status, variant) => {
      await expect(detect(data(null, { status }))).resolves.toBe(variant);
    });

    it.each([...UNMAPPED_STATUSES, 600])('maps status %i to no page', async (status) => {
      await expect(detect(data(null, status))).resolves.toBeNull();
      await expect(detect(data(null, { status }))).resolves.toBeNull();
    });

    it('maps a data() value without a status to no page', async () => {
      await expect(detect(data(null))).resolves.toBeNull();
    });
  });

  describe('a value that carries no readable status', () => {
    it.each([
      ['an init without a status', { type: 'DataWithResponseInit', init: {} }],
      ['a non-numeric init status', { type: 'DataWithResponseInit', init: { status: '404' } }],
      ['a primitive init', { type: 'DataWithResponseInit', init: 404 }],
      ['a null init', { type: 'DataWithResponseInit', init: null }],
      ['a missing init', { type: 'DataWithResponseInit' }],
      ['another type', { type: 'Other', init: { status: 404 } }],
      ['a plain status object', { status: 404 }],
    ])('maps %s to no page', async (_label, routeError) => {
      await expect(detect(routeError)).resolves.toBeNull();
    });

    it.each([
      ['a plain error', new Error('boom')],
      ['a chunk-load error', buildChunkLoadError()],
      ['null', null],
      ['undefined', undefined],
      ['a string', 'boom'],
      ['a number', 404],
    ])('maps %s to no page', async (_label, routeError) => {
      await expect(detect(routeError)).resolves.toBeNull();
    });
  });

  it('maps only the 500 to 599 boundaries to the server error page', async () => {
    const { default: detector } = await loadDetector();
    const results = [499, 500, 599, 600].map((status) =>
      detector.detect(buildRouteResponse(status))
    );

    expect(results).toEqual([null, 'serverError', 'serverError', null]);
  });

  it('maps a raw 403 Response and a raw 403 data() value to the forbidden page', async () => {
    await expect(detect(new Response(null, { status: 403 }))).resolves.toBe('forbidden');
    await expect(detect(data(null, { status: 403 }))).resolves.toBe('forbidden');
    await expect(detect(data(null))).resolves.toBeNull();
  });
});
