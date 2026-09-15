import authErrorReporter, {
  AuthErrorReporter,
} from '@/modules/user/features/auth/utils/auth-error-reporter';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';
import { buildToken } from '@tests/builders';

describe('AuthErrorReporter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates to the boundary reporter with the auth surface merged into the context', () => {
    const report = jest.spyOn(boundaryErrorReporter, 'report').mockImplementation();
    const error = new Error(buildToken());
    const componentStack = `\n    at ${buildToken()}`;

    new AuthErrorReporter().report(error, { componentStack });

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(error, { componentStack, surface: 'auth' });
  });

  it('overrides any surface the caller supplied — the auth boundary always reports as auth', () => {
    const report = jest.spyOn(boundaryErrorReporter, 'report').mockImplementation();
    const error = new Error(buildToken());

    new AuthErrorReporter().report(error, { surface: 'app' });

    expect(report).toHaveBeenCalledWith(error, { surface: 'auth' });
  });

  it('leaves the context the caller passed untouched', () => {
    jest.spyOn(boundaryErrorReporter, 'report').mockImplementation();
    const context: Record<string, unknown> = { componentStack: buildToken() };

    new AuthErrorReporter().report(new Error(buildToken()), context);

    expect(context).toEqual({ componentStack: context.componentStack });
  });

  it('reaches both cores through the delegation: the auth signal and the capture', () => {
    const boundaryCatch = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error(buildToken());
    const componentStack = `\n    at ${buildToken()}`;

    authErrorReporter.report(error, { componentStack });

    expect(boundaryCatch).toHaveBeenCalledWith('auth');
    expect(captureError).toHaveBeenCalledWith(error, { componentStack, surface: 'auth' });
  });

  it('exports a shared singleton instance', () => {
    expect(authErrorReporter).toBeInstanceOf(AuthErrorReporter);
  });
});
