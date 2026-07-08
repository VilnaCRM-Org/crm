import observabilityCore from '@/services/observability/observability-core';
import ObservabilityService from '@/services/observability/observability-service';

jest.mock('@/services/observability/observability-core', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    captureError: jest.fn(),
    report: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    reportVital: jest.fn(),
  },
}));

describe('ObservabilityService', () => {
  const service = new ObservabilityService();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates init to the core', () => {
    service.init();

    expect(observabilityCore.init).toHaveBeenCalledTimes(1);
  });

  it('delegates captureError to the core', () => {
    const error = new Error('x');

    service.captureError(error, { source: 'unit' });

    expect(observabilityCore.captureError).toHaveBeenCalledWith(error, { source: 'unit' });
  });

  it('delegates report to the core', () => {
    const error = new Error('x');

    service.report(error, { surface: 'app' });

    expect(observabilityCore.report).toHaveBeenCalledWith(error, { surface: 'app' });
  });

  it('delegates setUser to the core', () => {
    service.setUser({ id: 'opaque' });

    expect(observabilityCore.setUser).toHaveBeenCalledWith({ id: 'opaque' });
  });

  it('delegates clearUser to the core', () => {
    service.clearUser();

    expect(observabilityCore.clearUser).toHaveBeenCalledTimes(1);
  });

  it('delegates reportVital to the core', () => {
    const metric = { name: 'CLS', value: 0.1, id: 'v3' };

    service.reportVital(metric);

    expect(observabilityCore.reportVital).toHaveBeenCalledWith(metric);
  });
});
