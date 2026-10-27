import { act, renderHook, type RenderHookResult } from '@testing-library/react';

import useCodeSubmit from '@/modules/user/features/settings/hooks/use-code-submit';
import type { CodeSubmit } from '@/modules/user/features/settings/types/hooks/two-factor-submit';
import TwoFactorCodeNormalizer from '@/modules/user/lib/two-factor-code-normalizer';
import { buildRecoveryCode, buildTotpCode } from '@tests/builders';

import {
  EMPTY_SETTINGS,
  type TwoFactorOperationPlan,
  type TwoFactorSettingsOutcome,
} from './two-factor-test-deps';

const PLAN: TwoFactorOperationPlan = {
  view: 'codes',
  statusCode: null,
  record: null,
  failures: new Map(),
};

const CHANGED: TwoFactorSettingsOutcome = { kind: 'changed', settings: EMPTY_SETTINGS };

interface Mounted {
  readonly run: jest.Mock;
  readonly refuse: jest.Mock;
  readonly settle: jest.Mock;
  readonly result: RenderHookResult<CodeSubmit, unknown>['result'];
}

const mount = (accept: 'totp' | 'any', refusal: 'incomplete' | 'format'): Mounted => {
  const run = jest.fn().mockResolvedValue(CHANGED);
  const refuse = jest.fn();
  const settle = jest.fn();
  const entry = { normalizer: new TwoFactorCodeNormalizer(), accept, refusal, refuse };
  const { result } = renderHook(() => useCodeSubmit(entry, { run, plan: PLAN, settle }));
  return { run, refuse, settle, result };
};

describe('useCodeSubmit', () => {
  it('sends the normalised code, then settles with the plan', async () => {
    const { result, run, settle, refuse } = mount('totp', 'incomplete');
    const code = buildTotpCode();

    await act(async () =>
      result.current.send({ twoFactorCode: ` ${code.slice(0, 3)} ${code.slice(3)} ` })
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toEqual({ twoFactorCode: code });
    expect(settle).toHaveBeenCalledWith(CHANGED, PLAN);
    expect(refuse).not.toHaveBeenCalled();
  });

  it.each(['', '12345', 'abcdef', 'ABCD-2345'])(
    'refuses "%s" with the entry refusal for a totp-only entry and sends nothing',
    async (typed) => {
      const { result, run, refuse } = mount('totp', 'incomplete');

      await act(async () => result.current.send({ twoFactorCode: typed }));

      expect(run).not.toHaveBeenCalled();
      expect(refuse).toHaveBeenCalledTimes(1);
      expect(refuse).toHaveBeenCalledWith('incomplete');
    }
  );

  it('accepts a totp code and a recovery code for an any entry, normalising it', async () => {
    const { result, run } = mount('any', 'format');

    await act(async () => result.current.send({ twoFactorCode: buildTotpCode() }));
    await act(async () => result.current.send({ twoFactorCode: 'abcd2345' }));

    expect(run.mock.calls[1]?.[0]).toEqual({ twoFactorCode: 'ABCD-2345' });
  });

  it.each(['', '12345', 'abcd-234', 'ab!d-2345'])(
    'refuses "%s" with format for an any entry',
    async (typed) => {
      const { result, run, refuse } = mount('any', 'format');

      await act(async () => result.current.send({ twoFactorCode: typed }));

      expect(run).not.toHaveBeenCalled();
      expect(refuse).toHaveBeenCalledWith('format');
    }
  );

  it('resends the last normalised code', async () => {
    const { result, run } = mount('any', 'format');
    const code = buildRecoveryCode();
    await act(async () => result.current.send({ twoFactorCode: code.toLowerCase() }));

    await act(async () => result.current.resend());

    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1]?.[0]).toEqual({ twoFactorCode: code });
  });

  it('has nothing to resend after only a refused entry', async () => {
    const { result, run } = mount('totp', 'incomplete');
    await act(async () => result.current.send({ twoFactorCode: '12' }));

    await act(async () => result.current.resend());

    expect(run).not.toHaveBeenCalled();
  });

  it('reports busy while a send is in flight', async () => {
    const { result, run } = mount('totp', 'incomplete');
    run.mockReturnValue(new Promise(() => undefined));

    await act(async () => {
      result.current.send({ twoFactorCode: buildTotpCode() });
    });

    expect(result.current.isSubmitting).toBe(true);
  });
});
