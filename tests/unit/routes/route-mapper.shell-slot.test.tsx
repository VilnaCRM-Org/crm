import routeMapper from '@/routes/route-mapper';
import type { ShellChunkSource } from '@/routes/types/shell-slot';
import observabilityCore from '@/services/observability/observability-core';

describe('RouteMapper shell failure reporters', () => {
  let capture: jest.SpyInstance;

  beforeEach(() => {
    capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each<ShellChunkSource>(['app-shell:user-menu', 'app-shell:current-user'])(
    'captures a %s failure the slot reports with its source and no other context',
    (source) => {
      const failure = new Error(source);

      routeMapper.slotFailureReporter()(source, failure);

      expect(capture).toHaveBeenCalledTimes(1);
      expect(capture).toHaveBeenCalledWith(failure, { source });
    }
  );

  it('builds a reporter bound to one source for the shell chunk', () => {
    const failure = new Error('shell');

    routeMapper.chunkFailureReporter('app-shell:load')(failure);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(failure, { source: 'app-shell:load' });
  });
});
