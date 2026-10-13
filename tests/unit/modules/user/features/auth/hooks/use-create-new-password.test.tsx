import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, StrictMode } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useCreateNewPassword from '@auth/hooks/use-create-new-password';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { CreateNewPasswordFormValues } from '@auth/types/password-recovery/forms';
import type { CreateNewPasswordOutcome } from '@auth/types/password-recovery/outcome';
import { buildPassword, buildResetToken } from '@tests/builders';

const navigate = jest.fn();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: (): jest.Mock => navigate,
}));

interface Harness {
  readonly loader: AuthProviderLoader;
  readonly confirmReset: jest.Mock;
  readonly resolve: jest.Mock;
}

const harness = (outcome: CreateNewPasswordOutcome): Harness => {
  const confirmReset = jest.fn().mockResolvedValue(outcome);
  const resolve = jest.fn().mockResolvedValue({ confirmReset });
  return { loader: { resolve } as unknown as AuthProviderLoader, confirmReset, resolve };
};

const failed = (
  reason: 'invalid_link' | 'policy_rejected' | 'rate_limited' | 'server' | 'network',
  retryable = false
): CreateNewPasswordOutcome => ({
  kind: 'failed',
  failure: { reason, retryable },
});

const formValues = (token: string): CreateNewPasswordFormValues => {
  const newPassword = buildPassword();
  return { token, newPassword, confirmPassword: newPassword };
};

describe('useCreateNewPassword', () => {
  beforeEach(() => navigate.mockReset());

  it('starts invalid for a null token and never resolves the provider', () => {
    const { loader, resolve } = harness({ kind: 'confirmed' });

    const { result } = renderHook(() => useCreateNewPassword(loader, null));

    expect(result.current.view).toBe('invalid');
    expect(resolve).not.toHaveBeenCalled();
  });

  it('sends the token and new password once and navigates to sign-in on success', async () => {
    const { loader, confirmReset, resolve } = harness({ kind: 'confirmed' });
    const token = buildResetToken();
    const values = formValues(token);
    const writes = jest.spyOn(useAuthStore, 'setState');
    const { result } = renderHook(() => useCreateNewPassword(loader, token));

    await act(async () => {
      const { submit } = result.current.callbacks;
      await Promise.all([submit(values), submit(values)]);
    });

    expect(resolve).toHaveBeenCalledWith(AUTH_TOKENS.PasswordRecoveryProvider);
    expect(confirmReset).toHaveBeenCalledTimes(1);
    expect(confirmReset).toHaveBeenCalledWith(
      { token, newPassword: values.newPassword },
      expect.any(AbortSignal)
    );
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/sign-in', {
      replace: true,
      state: { focusMain: true, notice: 'password_reset' },
    });
    expect(writes).not.toHaveBeenCalled();
    writes.mockRestore();
  });

  it('switches to the invalid view for an invalid_link failure', async () => {
    const { loader } = harness(failed('invalid_link'));
    const token = buildResetToken();
    const { result } = renderHook(() => useCreateNewPassword(loader, token));

    await act(() => result.current.callbacks.submit(formValues(token)));

    expect(result.current.view).toBe('invalid');
    expect(result.current.failure).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['policy_rejected', failed('policy_rejected')],
    ['rate_limited', failed('rate_limited')],
    ['server', failed('server', true)],
    ['network', failed('network', true)],
  ])(
    'keeps the form with a %s failure and retries the same values once',
    async (_name, outcome) => {
      const { loader, confirmReset } = harness(outcome);
      const token = buildResetToken();
      const values = formValues(token);
      const { result } = renderHook(() => useCreateNewPassword(loader, token));

      await act(() => result.current.callbacks.submit(values));
      expect(result.current.view).toBe('form');
      expect(result.current.failure).toEqual(outcome.kind === 'failed' ? outcome.failure : null);

      await act(() => result.current.callbacks.retry());

      expect(confirmReset).toHaveBeenCalledTimes(2);
      expect(confirmReset.mock.calls[1]?.[0]).toEqual({ token, newPassword: values.newPassword });
    }
  );

  it('maps a rejected loader to a retryable network failure', async () => {
    const loader = {
      resolve: jest.fn().mockRejectedValue(new Error('chunk')),
    } as unknown as AuthProviderLoader;
    const token = buildResetToken();
    const { result } = renderHook(() => useCreateNewPassword(loader, token));

    await act(() => result.current.callbacks.submit(formValues(token)));

    expect(result.current.failure).toEqual({ reason: 'network', retryable: true });
    expect(result.current.view).toBe('form');
  });

  it('aborts the request on unmount and patches nothing', async () => {
    let signal: AbortSignal | undefined;
    const confirmReset = jest.fn(
      (_dto: unknown, received: AbortSignal) =>
        new Promise<CreateNewPasswordOutcome>(() => {
          signal = received;
        })
    );
    const loader = {
      resolve: jest.fn().mockResolvedValue({ confirmReset }),
    } as unknown as AuthProviderLoader;
    const token = buildResetToken();
    const { result, unmount } = renderHook(() => useCreateNewPassword(loader, token));

    act(() => {
      void result.current.callbacks.submit(formValues(token));
    });
    await act(async () => Promise.resolve());
    unmount();

    expect(signal?.aborted).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends one request from a StrictMode component', async () => {
    const { loader, confirmReset } = harness({ kind: 'confirmed' });
    const token = buildResetToken();
    const values = formValues(token);

    function Confirmer(): JSX.Element {
      const { callbacks } = useCreateNewPassword(loader, token);
      return (
        <button type="button" onClick={() => void callbacks.submit(values)}>
          Confirm
        </button>
      );
    }

    render(
      <StrictMode>
        <Confirmer />
      </StrictMode>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(confirmReset).toHaveBeenCalledTimes(1);
  });
});
