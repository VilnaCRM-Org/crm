import observabilityCore, { ObservabilityCore } from '@/services/observability/observability-core';
import ObservabilityService from '@/services/observability/observability-service';

const createCore = (): ObservabilityCore => {
  const core = new ObservabilityCore();
  jest.spyOn(core, 'init').mockImplementation();
  jest.spyOn(core, 'captureError').mockImplementation();
  jest.spyOn(core, 'report').mockImplementation();
  jest.spyOn(core, 'setUser').mockImplementation();
  jest.spyOn(core, 'clearUser').mockImplementation();
  jest.spyOn(core, 'reportVital').mockImplementation();
  return core;
};

describe('ObservabilityService', () => {
  const core = createCore();
  const service = new ObservabilityService(core);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates init to the core', () => {
    service.init();

    expect(core.init).toHaveBeenCalledTimes(1);
  });

  it('delegates captureError to the core', () => {
    const error = new Error('x');

    service.captureError(error, { source: 'unit' });

    expect(core.captureError).toHaveBeenCalledWith(error, { source: 'unit' });
  });

  it('delegates report to the core', () => {
    const error = new Error('x');

    service.report(error, { surface: 'app' });

    expect(core.report).toHaveBeenCalledWith(error, { surface: 'app' });
  });

  it('delegates setUser to the core', () => {
    service.setUser({ id: 'opaque' });

    expect(core.setUser).toHaveBeenCalledWith({ id: 'opaque' });
  });

  it('delegates clearUser to the core', () => {
    service.clearUser();

    expect(core.clearUser).toHaveBeenCalledTimes(1);
  });

  it('delegates reportVital to the core', () => {
    const metric = { name: 'CLS', value: 0.1, id: 'v3' };

    service.reportVital(metric);

    expect(core.reportVital).toHaveBeenCalledWith(metric);
  });

  it('delegates to the injected core rather than the module singleton', () => {
    const singletonInit = jest.spyOn(observabilityCore, 'init').mockImplementation();

    try {
      service.init();

      expect(core.init).toHaveBeenCalledTimes(1);
      expect(singletonInit).not.toHaveBeenCalled();
    } finally {
      singletonInit.mockRestore();
    }
  });
});
