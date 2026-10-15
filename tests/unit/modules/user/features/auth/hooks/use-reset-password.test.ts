import { act, renderHook } from '@testing-library/react';
import * as React from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useResetPassword from '@auth/hooks/use-reset-password';
import type { AuthProviderLoader } from '@auth/stores';
import type { ResetPasswordOutcome } from '@auth/types/password-recovery/outcome';
import { buildEmail } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@auth/stores', () => ({}));

interface Harness {
  readonly loader: AuthProviderLoader;
  readonly requestReset: jest.Mock;
  readonly resolve: jest.Mock;
}

const harness = (outcome: ResetPasswordOutcome): Harness => {
  const requestReset = jest.fn().mockResolvedValue(outcome);
  const resolve = jest.fn().mockResolvedValue({ requestReset });
  return { loader: { resolve } as unknown as AuthProviderLoader, requestReset, resolve };
};

const SENT: ResetPasswordOutcome = { kind: 'sent', maskedEmail: 'eir*****@gmail.com' };
const NETWORK: ResetPasswordOutcome = {
  kind: 'failed',
  failure: { reason: 'network', retryable: true },
};

describe('useResetPassword', () => {
  it('sends the trimmed e-mail to the provider resolved through the loader', async () => {
    const { loader, requestReset, resolve } = harness(SENT);
    const email = buildEmail();
    const { result } = renderHook(() => useResetPassword(loader));

    await act(() => result.current.callbacks.submit({ email: `  ${email} ` }));

    expect(resolve).toHaveBeenCalledWith(AUTH_TOKENS.PasswordRecoveryProvider);
    expect(requestReset).toHaveBeenCalledWith({ email }, expect.any(AbortSignal));
  });

  it('moves to the sent step with the masked and submitted e-mail', async () => {
    const { loader } = harness(SENT);
    const email = buildEmail();
    const { result } = renderHook(() => useResetPassword(loader));

    await act(() => result.current.callbacks.submit({ email }));

    expect(result.current).toMatchObject({
      step: 'sent',
      maskedEmail: 'eir*****@gmail.com',
      submittedEmail: email,
      failure: null,
      isSubmitting: false,
      returned: false,
    });
  });

  it('keeps the form step with the failure and clears it on the next submit', async () => {
    const { loader, requestReset } = harness(NETWORK);
    const email = buildEmail();
    const { result } = renderHook(() => useResetPassword(loader));

    await act(() => result.current.callbacks.submit({ email: ` ${email}` }));
    expect(result.current.step).toBe('form');
    expect(result.current.failure).toEqual({ reason: 'network', retryable: true });

    requestReset.mockResolvedValue(SENT);
    await act(() => result.current.callbacks.submit({ email: `${email} ` }));

    expect(requestReset).toHaveBeenCalledTimes(2);
    expect(requestReset.mock.calls[1]?.[0]).toEqual({ email });
    expect(result.current).toMatchObject({ step: 'sent', failure: null, submittedEmail: email });
  });

  it('dismisses the failure without a request and keeps the submitted e-mail', async () => {
    const { loader, requestReset } = harness(NETWORK);
    const email = buildEmail();
    const { result } = renderHook(() => useResetPassword(loader));
    await act(() => result.current.callbacks.submit({ email }));

    act(() => result.current.callbacks.dismissFailure());

    expect(requestReset).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ step: 'form', failure: null, submittedEmail: email });
  });

  it('maps a rejected loader to a retryable network failure', async () => {
    const loader = {
      resolve: jest.fn().mockRejectedValue(new Error('chunk')),
    } as unknown as AuthProviderLoader;
    const { result } = renderHook(() => useResetPassword(loader));

    await act(() => result.current.callbacks.submit({ email: buildEmail() }));

    expect(result.current.step).toBe('form');
    expect(result.current.failure).toEqual({ reason: 'network', retryable: true });
  });

  it('returns to the form from the sent step without calling the provider', async () => {
    const { loader, requestReset } = harness(SENT);
    const email = buildEmail();
    const { result } = renderHook(() => useResetPassword(loader));
    await act(() => result.current.callbacks.submit({ email }));

    act(() => result.current.callbacks.backToForm());

    expect(result.current).toMatchObject({
      step: 'form',
      failure: null,
      submittedEmail: email,
      returned: true,
    });
    expect(requestReset).toHaveBeenCalledTimes(1);
  });

  it('patches nothing for a submit refused as a duplicate', async () => {
    const { loader, requestReset } = harness(SENT);
    const { result } = renderHook(() => useResetPassword(loader));

    await act(async () => {
      const { submit } = result.current.callbacks;
      await Promise.all([submit({ email: buildEmail() }), submit({ email: buildEmail() })]);
    });

    expect(requestReset).toHaveBeenCalledTimes(1);
    expect(result.current.step).toBe('sent');
  });

  it('keeps the accepted e-mail when a concurrent submit of another one is refused', async () => {
    const { loader, requestReset } = harness(NETWORK);
    const accepted = buildEmail();
    const refused = `other.${buildEmail()}`;
    const { result } = renderHook(() => useResetPassword(loader));

    await act(async () => {
      const { submit } = result.current.callbacks;
      await Promise.all([submit({ email: accepted }), submit({ email: refused })]);
    });
    expect(result.current.submittedEmail).toBe(accepted);

    act(() => result.current.callbacks.backToForm());

    expect(requestReset.mock.calls.map(([dto]) => dto)).toEqual([{ email: accepted }]);
    expect(result.current).toMatchObject({ step: 'form', submittedEmail: accepted });
  });
});

describe('useResetPassword loaded inside the test', () => {
  it('evaluates the initial view it starts from', async () => {
    const freshUseResetPassword = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      return (await import('@auth/hooks/use-reset-password')).default;
    });
    const { loader } = harness(SENT);

    const { result } = renderHook(() => freshUseResetPassword(loader));

    expect(result.current).toEqual({
      step: 'form',
      submittedEmail: '',
      maskedEmail: null,
      failure: null,
      returned: false,
      isSubmitting: false,
      callbacks: expect.any(Object),
    });
  });
});
