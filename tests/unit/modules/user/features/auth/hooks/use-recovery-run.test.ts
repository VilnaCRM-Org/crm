import { renderHook } from '@testing-library/react';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useRecoveryRun from '@auth/hooks/use-recovery-run';
import type { AuthProviderLoader } from '@auth/stores';
import type { RecoveryProviderStep } from '@auth/types/password-recovery/state';
import { buildEmail } from '@tests/builders';

interface StepCall {
  readonly dto: string;
  readonly signal: AbortSignal;
}

type Step = RecoveryProviderStep<string, StepCall> & jest.Mock;

const providerLoader = (provider: object): AuthProviderLoader =>
  ({ resolve: jest.fn().mockResolvedValue(provider) }) as unknown as AuthProviderLoader;

const echoStep = (): Step =>
  jest.fn(async (_provider: unknown, dto: string, signal: AbortSignal) => ({ dto, signal }));

interface RunProps {
  readonly loader: AuthProviderLoader;
  readonly step: Step;
}

describe('useRecoveryRun', () => {
  it('resolves the recovery provider and hands it the dto and signal', async () => {
    const provider = { name: 'provider' };
    const loader = providerLoader(provider);
    const step = echoStep();
    const dto = buildEmail();
    const { signal } = new AbortController();
    const { result } = renderHook(() => useRecoveryRun(loader, step));

    await expect(result.current(dto, signal)).resolves.toEqual({ dto, signal });

    expect(loader.resolve).toHaveBeenCalledWith(AUTH_TOKENS.PasswordRecoveryProvider);
    expect(step).toHaveBeenCalledWith(provider, dto, signal);
  });

  it('maps a rejected provider load to a retryable network failure', async () => {
    const loader = {
      resolve: jest.fn().mockRejectedValue(new Error('chunk failed')),
    } as unknown as AuthProviderLoader;
    const step = echoStep();
    const { result } = renderHook(() => useRecoveryRun(loader, step));

    await expect(result.current(buildEmail(), new AbortController().signal)).resolves.toEqual({
      kind: 'failed',
      failure: { reason: 'network', retryable: true },
    });
    expect(step).not.toHaveBeenCalled();
  });

  it('keeps one run across renders and rebuilds it for a new loader or step', async () => {
    const first: RunProps = { loader: providerLoader({}), step: echoStep() };
    const { result, rerender } = renderHook(
      (props: RunProps) => useRecoveryRun(props.loader, props.step),
      { initialProps: first }
    );
    const initial = result.current;

    rerender(first);
    expect(result.current).toBe(initial);

    const nextLoader: RunProps = { ...first, loader: providerLoader({}) };
    rerender(nextLoader);
    await result.current(buildEmail(), new AbortController().signal);
    expect(nextLoader.loader.resolve).toHaveBeenCalledTimes(1);
    expect(first.loader.resolve).not.toHaveBeenCalled();

    const nextStep: RunProps = { ...nextLoader, step: echoStep() };
    rerender(nextStep);
    await result.current(buildEmail(), new AbortController().signal);
    expect(nextStep.step).toHaveBeenCalledTimes(1);
    expect(first.step).toHaveBeenCalledTimes(1);
  });
});
