import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type JSX, StrictMode } from 'react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useCreateNewPassword from '@auth/hooks/use-create-new-password';
import type { AuthProviderLoader } from '@auth/stores';
import useAuthStore from '@auth/stores/use-auth-store';
import type { CreateNewPasswordFormValues } from '@auth/types/password-recovery/forms';
import type { CreateNewPasswordOutcome } from '@auth/types/password-recovery/outcome';
import type {
  CreateNewPasswordFormState,
  CreateNewPasswordState,
} from '@auth/types/password-recovery/state';
import { buildPassword, buildResetToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

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

const formState = (state: CreateNewPasswordState): CreateNewPasswordFormState => {
  if (state.view !== 'form') throw new Error(`expected the form view, got ${state.view}`);
  return state;
};

interface Deferred {
  readonly promise: Promise<CreateNewPasswordOutcome>;
  readonly resolve: (outcome: CreateNewPasswordOutcome) => void;
}

const deferred = (): Deferred => {
  let resolve: (outcome: CreateNewPasswordOutcome) => void = () => undefined;
  const promise = new Promise<CreateNewPasswordOutcome>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const formValues = (token: string): CreateNewPasswordFormValues => {
  const newPassword = buildPassword();
  return { token, newPassword, confirmPassword: newPassword };
};

describe('useCreateNewPassword', () => {
  beforeEach(() => navigate.mockReset());

  afterEach(() => jest.restoreAllMocks());

  it('starts in the form view and resolves nothing before a submit', () => {
    const { loader, resolve } = harness({ kind: 'confirmed' });

    const { result } = renderHook(() => useCreateNewPassword(loader));

    expect(formState(result.current).failure).toBeNull();
    expect(formState(result.current).isSubmitting).toBe(false);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('sends the token and new password once and navigates to sign-in on success', async () => {
    const { loader, confirmReset, resolve } = harness({ kind: 'confirmed' });
    const token = buildResetToken();
    const values = formValues(token);
    const writes = jest.spyOn(useAuthStore, 'setState');
    const { result } = renderHook(() => useCreateNewPassword(loader));

    await act(async () => {
      const { submit } = formState(result.current).callbacks;
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
    expect(formState(result.current).failure).toBeNull();
  });

  it('switches to the invalid-link view for an invalid_link failure', async () => {
    const { loader, confirmReset } = harness(failed('invalid_link'));
    const token = buildResetToken();
    const { result } = renderHook(() => useCreateNewPassword(loader));
    const { submit } = formState(result.current).callbacks;

    await act(() => submit(formValues(token)));

    expect(result.current).toEqual({ view: 'invalid' });
    expect(navigate).not.toHaveBeenCalled();
    expect(confirmReset).toHaveBeenCalledTimes(1);
  });

  it('clears a shown failure as soon as the next attempt starts', async () => {
    const { loader, confirmReset } = harness(failed('server', true));
    const token = buildResetToken();
    const values = formValues(token);
    const { result } = renderHook(() => useCreateNewPassword(loader));
    await act(() => formState(result.current).callbacks.submit(values));

    const pending = deferred();
    confirmReset.mockReturnValueOnce(pending.promise);
    expect(formState(result.current).failure).toEqual({ reason: 'server', retryable: true });
    let settled: Promise<void> = Promise.resolve();
    act(() => {
      settled = formState(result.current).callbacks.submit(values);
    });

    expect(formState(result.current).failure).toBeNull();
    await act(async () => {
      pending.resolve(failed('server', true));
      await settled;
    });
    expect(formState(result.current).failure).toEqual({ reason: 'server', retryable: true });
  });

  it.each([
    ['policy_rejected', failed('policy_rejected')],
    ['rate_limited', failed('rate_limited')],
    ['server', failed('server', true)],
    ['network', failed('network', true)],
  ])(
    'keeps the form with a %s failure and resubmits the values sent next',
    async (_name, outcome) => {
      const { loader, confirmReset } = harness(outcome);
      const token = buildResetToken();
      const values = formValues(token);
      const { result } = renderHook(() => useCreateNewPassword(loader));

      await act(() => formState(result.current).callbacks.submit(values));
      expect(formState(result.current).failure).toEqual(
        outcome.kind === 'failed' ? outcome.failure : null
      );

      const edited = formValues(token);
      await act(() => formState(result.current).callbacks.submit(edited));

      expect(confirmReset).toHaveBeenCalledTimes(2);
      expect(confirmReset.mock.calls[1]?.[0]).toEqual({ token, newPassword: edited.newPassword });
    }
  );

  it('dismisses a shown failure without sending a request', async () => {
    const { loader, confirmReset } = harness(failed('server', true));
    const token = buildResetToken();
    const { result } = renderHook(() => useCreateNewPassword(loader));
    await act(() => formState(result.current).callbacks.submit(formValues(token)));
    expect(formState(result.current).failure).toEqual({ reason: 'server', retryable: true });

    act(() => formState(result.current).callbacks.dismissFailure());

    expect(formState(result.current).failure).toBeNull();
    expect(confirmReset).toHaveBeenCalledTimes(1);
  });

  it('maps a rejected loader to a retryable network failure', async () => {
    const loader = {
      resolve: jest.fn().mockRejectedValue(new Error('chunk')),
    } as unknown as AuthProviderLoader;
    const token = buildResetToken();
    const { result } = renderHook(() => useCreateNewPassword(loader));

    await act(() => formState(result.current).callbacks.submit(formValues(token)));

    expect(formState(result.current).failure).toEqual({ reason: 'network', retryable: true });
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
    const { result, unmount } = renderHook(() => useCreateNewPassword(loader));

    act(() => {
      void formState(result.current).callbacks.submit(formValues(token));
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
      const { callbacks } = formState(useCreateNewPassword(loader));
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

describe('useCreateNewPassword loaded inside the test', () => {
  const loadFresh = (): Promise<typeof useCreateNewPassword> =>
    loadIsolated(async () => {
      jest.doMock('react', () => React);
      return (await import('@auth/hooks/use-create-new-password')).default;
    });

  beforeEach(() => navigate.mockReset());

  it('evaluates the invalid-link state it returns for an invalid_link failure', async () => {
    const freshUseCreateNewPassword = await loadFresh();
    const { loader } = harness(failed('invalid_link'));
    const { result } = renderHook(() => freshUseCreateNewPassword(loader));

    await act(() => formState(result.current).callbacks.submit(formValues(buildResetToken())));

    expect(result.current).toStrictEqual({ view: 'invalid' });
  });

  it('evaluates the sign-in arrival state it navigates with on success', async () => {
    const freshUseCreateNewPassword = await loadFresh();
    const { loader } = harness({ kind: 'confirmed' });
    const token = buildResetToken();
    const { result } = renderHook(() => freshUseCreateNewPassword(loader));

    await act(() => formState(result.current).callbacks.submit(formValues(token)));

    expect(navigate).toHaveBeenCalledWith('/sign-in', {
      replace: true,
      state: { focusMain: true, notice: 'password_reset' },
    });
  });
});
