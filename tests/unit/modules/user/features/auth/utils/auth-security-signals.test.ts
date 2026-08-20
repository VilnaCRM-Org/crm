import 'reflect-metadata';

import type { ObservabilityService } from '@/services/types/observability/observability';
import type { SecurityEventRecorder } from '@/services/types/security-events/security-event';
import type { AuthError } from '@auth/types/auth-error';
import AuthSecuritySignals from '@auth/utils/auth-security-signals';
import { buildEmail, buildPassword } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const buildRecorder = (): SecurityEventRecorder => ({
  authFailure: jest.fn(),
  unauthorizedResponse: jest.fn(),
  boundaryCatch: jest.fn(),
});

const buildObservability = (): ObservabilityService =>
  ({
    init: jest.fn(),
    captureError: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    reportVital: jest.fn(),
  }) as unknown as ObservabilityService;

const authError = (kind: AuthError['kind']): AuthError => ({
  kind,
  displayMessage: 'nope',
  retryable: false,
});

describe('AuthSecuritySignals', () => {
  it('tags an opaque session identity on a successful login', () => {
    const observability = buildObservability();
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, observability).loginSettled({
      ok: true,
      value: { email: buildEmail(), token: 'session-token' },
    });

    expect(observability.setUser).toHaveBeenCalledWith({ id: expect.any(String) });
    expect((observability.setUser as jest.Mock).mock.calls[0][0].id).toHaveLength(36);
    expect(recorder.authFailure).not.toHaveBeenCalled();
  });

  it('emits an auth_failure for a rejected login result', () => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).loginSettled({
      ok: false,
      error: authError('authentication'),
    });

    expect(recorder.authFailure).toHaveBeenCalledWith('login', 'authentication');
  });

  it('stays silent for an aborted login or registration result', () => {
    const recorder = buildRecorder();
    const observability = buildObservability();
    const aborted = { ...authError('network'), aborted: true };
    const signals = new AuthSecuritySignals(recorder, observability);

    signals.loginSettled({ ok: false, error: aborted });
    signals.registerSettled({ ok: false, error: aborted });

    expect(recorder.authFailure).not.toHaveBeenCalled();
    expect(observability.setUser).not.toHaveBeenCalled();
  });

  it('emits an auth_failure for a rejected registration result only', () => {
    const recorder = buildRecorder();
    const signals = new AuthSecuritySignals(recorder, buildObservability());

    signals.registerSettled({ ok: true, value: { email: buildEmail() } });
    signals.registerSettled({ ok: false, error: authError('conflict') });

    expect(recorder.authFailure).toHaveBeenCalledTimes(1);
    expect(recorder.authFailure).toHaveBeenCalledWith('registration', 'conflict');
  });

  it.each<[AuthError['kind']]>([
    ['authentication'],
    ['validation'],
    ['conflict'],
    ['server'],
    ['network'],
  ])('maps the %s auth-error kind onto the security-event reason', (kind) => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).loginFailed(authError(kind));

    expect(recorder.authFailure).toHaveBeenCalledWith('login', kind);
  });

  it('reports an unrecognized auth-error kind as unknown', () => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).loginFailed({ kind: 'teapot' });

    expect(recorder.authFailure).toHaveBeenCalledWith('login', 'unknown');
  });

  it.each([[null], [undefined], ['boom'], [42]])(
    'reports a non-object rejection (%p) as unknown',
    (error) => {
      const recorder = buildRecorder();

      new AuthSecuritySignals(recorder, buildObservability()).registerFailed(error);

      expect(recorder.authFailure).toHaveBeenCalledWith('registration', 'unknown');
    }
  );

  it('classifies a 429 rejection as rate_limited regardless of its kind', () => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).loginFailed({
      status: 429,
      kind: 'server',
    });

    expect(recorder.authFailure).toHaveBeenCalledWith('login', 'rate_limited');
  });

  it('ignores a non-numeric status when classifying the failure', () => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).loginFailed({
      status: '429',
      kind: 'network',
    });

    expect(recorder.authFailure).toHaveBeenCalledWith('login', 'network');
  });

  it('emits nothing that could carry the submitted credentials', () => {
    const recorder = buildRecorder();
    const password = buildPassword();
    const email = buildEmail();

    new AuthSecuritySignals(recorder, buildObservability()).loginFailed({
      kind: 'authentication',
      displayMessage: `Invalid credentials for ${email}`,
      password,
    });

    expect(JSON.stringify((recorder.authFailure as jest.Mock).mock.calls)).not.toContain(password);
    expect(JSON.stringify((recorder.authFailure as jest.Mock).mock.calls)).not.toContain(email);
  });

  it('reports a registration failure under the registration category', () => {
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, buildObservability()).registerFailed(authError('conflict'));

    expect(recorder.authFailure).toHaveBeenCalledWith('registration', 'conflict');
  });

  // The recognized-reason set and the rate-limit status are module-level values, so the module is
  // evaluated inside the test body to keep a mutant in them reachable (issue #171).
  it('pins the recognized reason set and the rate-limit status at module scope', async () => {
    const Signals = await loadIsolated(
      async () => (await import('@auth/utils/auth-security-signals')).default
    );
    const recorder = buildRecorder();
    const signals = new Signals(recorder, buildObservability());

    signals.loginFailed(authError('authentication'));
    signals.loginFailed(authError('network'));
    signals.loginFailed({ status: 429, kind: 'server' });

    expect((recorder.authFailure as jest.Mock).mock.calls).toEqual([
      ['login', 'authentication'],
      ['login', 'network'],
      ['login', 'rate_limited'],
    ]);
  });
});
