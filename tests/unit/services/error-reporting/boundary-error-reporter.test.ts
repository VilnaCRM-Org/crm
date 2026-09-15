import boundaryErrorReporter, {
  BoundaryErrorReporter,
} from '@/services/error-reporting/boundary-error-reporter';
import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';
import type { ErrorReporter } from '@/services/types/error-reporting';
import { buildToken } from '@tests/builders';

type CoreSpies = { boundaryCatch: jest.SpyInstance; captureError: jest.SpyInstance };

const spyOnCores = (): CoreSpies => ({
  boundaryCatch: jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation(),
  captureError: jest.spyOn(observabilityCore, 'captureError').mockImplementation(),
});

describe('BoundaryErrorReporter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports a module singleton that satisfies the ErrorReporter contract', () => {
    const reporter: ErrorReporter = boundaryErrorReporter;

    expect(boundaryErrorReporter).toBeInstanceOf(BoundaryErrorReporter);
    expect(typeof reporter.report).toBe('function');
  });

  it('records the app surface when no context is given', () => {
    const { boundaryCatch, captureError } = spyOnCores();
    const error = new Error(buildToken());

    boundaryErrorReporter.report(error);

    expect(boundaryCatch).toHaveBeenCalledTimes(1);
    expect(boundaryCatch).toHaveBeenCalledWith('app');
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('records the app surface when the context names no surface', () => {
    const { boundaryCatch, captureError } = spyOnCores();
    const error = new Error(buildToken());
    const context = { componentStack: `\n    at ${buildToken()}` };

    boundaryErrorReporter.report(error, context);

    expect(boundaryCatch).toHaveBeenCalledWith('app');
    expect(captureError).toHaveBeenCalledWith(error, context);
  });

  it.each(['route', 'auth'])('records the %s surface named by the context', (surface) => {
    const { boundaryCatch, captureError } = spyOnCores();
    const error = new Error(buildToken());

    boundaryErrorReporter.report(error, { surface });

    expect(boundaryCatch).toHaveBeenCalledWith(surface);
    expect(captureError).toHaveBeenCalledWith(error, { surface });
  });

  it('stringifies a surface that is not a string instead of dropping it', () => {
    const { boundaryCatch } = spyOnCores();

    boundaryErrorReporter.report(new Error(buildToken()), { surface: 42 });

    expect(boundaryCatch).toHaveBeenCalledWith('42');
  });

  it('passes the context object through to the capture untouched', () => {
    const { captureError } = spyOnCores();
    const context = { surface: 'route', componentStack: buildToken() };

    boundaryErrorReporter.report(new Error(buildToken()), context);

    expect(captureError.mock.calls[0]?.[1]).toBe(context);
  });

  it('emits the security signal before the observability capture', () => {
    const { boundaryCatch, captureError } = spyOnCores();

    boundaryErrorReporter.report(new Error(buildToken()));

    const [signalOrder] = boundaryCatch.mock.invocationCallOrder;
    const [captureOrder] = captureError.mock.invocationCallOrder;
    expect(signalOrder).toBeLessThan(captureOrder ?? Number.NEGATIVE_INFINITY);
  });

  it('propagates a throwing security-event core and never reaches the capture', () => {
    const { boundaryCatch, captureError } = spyOnCores();
    const failure = new Error(buildToken());
    boundaryCatch.mockImplementation(() => {
      throw failure;
    });

    expect(() => boundaryErrorReporter.report(new Error(buildToken()))).toThrow(failure);
    expect(captureError).not.toHaveBeenCalled();
  });

  it('propagates a throwing observability capture after the signal was emitted', () => {
    const { boundaryCatch, captureError } = spyOnCores();
    const failure = new Error(buildToken());
    captureError.mockImplementation(() => {
      throw failure;
    });

    expect(() => boundaryErrorReporter.report(new Error(buildToken()))).toThrow(failure);
    expect(boundaryCatch).toHaveBeenCalledTimes(1);
  });
});
