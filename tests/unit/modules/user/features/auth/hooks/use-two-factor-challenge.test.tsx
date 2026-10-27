import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import useTwoFactorChallenge from '@auth/hooks/use-two-factor-challenge';
import type { AuthProviderLoader } from '@auth/stores';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import type {
  ChallengeSubmitHookDeps,
  TwoFactorChallengeProps,
} from '@auth/types/two-factor/challenge-view';

const mockSubmit = jest.fn();
const mockDeps = jest.fn();
let mockSubmitting = false;

jest.mock('@auth/hooks/use-challenge-submit', () => ({
  __esModule: true,
  default: (deps: ChallengeSubmitHookDeps): object => {
    mockDeps(deps);
    return { isSubmitting: mockSubmitting, submit: mockSubmit };
  },
}));

const constructed = jest.fn();

jest.mock('@/modules/user/lib/two-factor-code-normalizer', () => {
  const Actual = jest.requireActual('@/modules/user/lib/two-factor-code-normalizer').default;
  class CountingNormalizer extends Actual {
    constructor() {
      super();
      constructed();
    }
  }
  return { __esModule: true, default: CountingNormalizer };
});

const loader = {} as unknown as AuthProviderLoader;

const failed = (reason: ChallengeFailureReason): ChallengeResult => ({ kind: 'failed', reason });

type Harness = RenderHookResult<TwoFactorChallengeProps, unknown>;

interface RouterWrapperProps {
  readonly children: ReactNode;
}

const wrapperFor = (state: object | null): ((props: RouterWrapperProps) => JSX.Element) => {
  function RouterWrapper({ children }: RouterWrapperProps): JSX.Element {
    return (
      <MemoryRouter initialEntries={[{ pathname: '/sign-in/two-factor', state }]}>
        {children}
      </MemoryRouter>
    );
  }
  return RouterWrapper;
};

const setUp = (state: object | null = null): Harness =>
  renderHook(() => useTwoFactorChallenge(loader), { wrapper: wrapperFor(state) });

const submitCode = async (
  view: Harness,
  twoFactorCode: string,
  result: ChallengeResult | null = failed('server')
): Promise<void> => {
  mockSubmit.mockResolvedValueOnce(result);
  await act(async () => {
    view.result.current.callbacks.submit({ twoFactorCode });
  });
};

describe('useTwoFactorChallenge', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    mockDeps.mockReset();
    constructed.mockReset();
    mockSubmitting = false;
  });

  it('starts in authenticator mode with nothing entered or shown', () => {
    const { result } = setUp();

    expect(result.current.state).toEqual({
      mode: 'totp',
      value: '',
      fieldError: null,
      banner: null,
      focusRequest: 0,
      isSubmitting: false,
    });
  });

  it('mirrors the in-flight flag of the submitter', () => {
    mockSubmitting = true;

    expect(setUp().result.current.state.isSubmitting).toBe(true);
  });

  it.each(['', '1', '123', '12345', ' 12 34 5 '])(
    'shows incomplete, asks for focus and sends nothing for %j in authenticator mode',
    async (raw) => {
      const view = setUp();

      await submitCode(view, raw);

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(view.result.current.state).toMatchObject({
        value: raw,
        fieldError: 'incomplete',
        focusRequest: 1,
        banner: null,
      });
    }
  );

  it.each(['1234567', '12345a', 'abcdef', '12-345'])(
    'shows format and sends nothing for %j in authenticator mode',
    async (raw) => {
      const view = setUp();

      await submitCode(view, raw);

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(view.result.current.state).toMatchObject({ fieldError: 'format', focusRequest: 1 });
    }
  );

  it.each(['', 'abc', 'abcd-123', '12345'])(
    'shows format for %j in recovery mode and sends nothing',
    async (raw) => {
      const view = setUp();
      act(() => view.result.current.callbacks.switchMode());

      await submitCode(view, raw);

      expect(mockSubmit).not.toHaveBeenCalled();
      expect(view.result.current.state).toMatchObject({
        mode: 'recovery',
        fieldError: 'format',
        focusRequest: 2,
      });
    }
  );

  it('never submits by itself while digits change', () => {
    const view = setUp();

    act(() => view.result.current.callbacks.switchMode());
    act(() => view.result.current.callbacks.switchMode());

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('sends the normalised six digits once and keeps what was typed', async () => {
    const view = setUp();

    await submitCode(view, ' 123 456 ');

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({ twoFactorCode: '123456' });
    expect(view.result.current.state.value).toBe(' 123 456 ');
    expect(view.result.current.state.fieldError).toBeNull();
  });

  it.each([
    ['abcd2345', 'ABCD-2345'],
    ['abcd-2345', 'ABCD-2345'],
  ])('sends the recovery code %s as %s', async (raw, normalised) => {
    const view = setUp();
    act(() => view.result.current.callbacks.switchMode());

    await submitCode(view, raw);

    expect(mockSubmit).toHaveBeenCalledWith({ twoFactorCode: normalised });
  });

  it('refuses a recovery-shaped code in authenticator mode', async () => {
    const view = setUp();

    await submitCode(view, 'abcd-2345');

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(view.result.current.state.fieldError).toBe('format');
  });

  it('clears the value, flags invalid_code, asks for focus and keeps the mode', async () => {
    const view = setUp();
    act(() => view.result.current.callbacks.switchMode());

    await submitCode(view, 'abcd2345', failed('invalid_code'));

    expect(view.result.current.state).toMatchObject({
      mode: 'recovery',
      value: '',
      fieldError: 'invalid_code',
      banner: null,
      focusRequest: 2,
    });
  });

  it.each([
    ['rate_limited', 'rate_limited'],
    ['network', 'transient'],
    ['server', 'transient'],
  ] as const)(
    'shows the %s failure as the %s banner and keeps value and mode',
    async (reason, banner) => {
      const view = setUp();

      await submitCode(view, '123456', failed(reason));

      expect(view.result.current.state).toMatchObject({
        mode: 'totp',
        value: '123456',
        fieldError: null,
        banner,
        focusRequest: 0,
      });
    }
  );

  it.each([
    [failed('expired_session')],
    [failed('locked')],
    [{ kind: 'completed', token: 't', recoveryCodesRemaining: null } as ChallengeResult],
    [null],
  ])('leaves the view alone for %j', async (result) => {
    const view = setUp();

    await submitCode(view, '123456', result);

    expect(view.result.current.state).toMatchObject({
      value: '123456',
      fieldError: null,
      banner: null,
      focusRequest: 0,
    });
  });

  it('clears the banner and the field error when a new submit starts', async () => {
    const view = setUp();
    await submitCode(view, '123456', failed('network'));
    expect(view.result.current.state.banner).toBe('transient');

    await submitCode(view, '654321', failed('invalid_code'));

    expect(view.result.current.state).toMatchObject({ banner: null, fieldError: 'invalid_code' });
  });

  it('retries with exactly one more identical request', async () => {
    const view = setUp();
    await submitCode(view, '123 456', failed('network'));
    mockSubmit.mockResolvedValueOnce(failed('server'));

    await act(async () => {
      view.result.current.callbacks.retry();
    });

    expect(mockSubmit).toHaveBeenCalledTimes(2);
    expect(mockSubmit).toHaveBeenNthCalledWith(2, { twoFactorCode: '123456' });
    expect(view.result.current.state).toMatchObject({ value: '123 456', banner: 'transient' });
  });

  it('retries nothing before a code was sent', () => {
    const view = setUp();

    act(() => view.result.current.callbacks.retry());

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('switches mode, clears value and errors, asks for focus, and switches back', async () => {
    const view = setUp();
    await submitCode(view, '12', failed('server'));
    expect(view.result.current.state.fieldError).toBe('incomplete');

    act(() => view.result.current.callbacks.switchMode());
    expect(view.result.current.state).toMatchObject({
      mode: 'recovery',
      value: '',
      fieldError: null,
      banner: null,
      focusRequest: 2,
    });

    act(() => view.result.current.callbacks.switchMode());
    expect(view.result.current.state).toMatchObject({ mode: 'totp', focusRequest: 3 });
  });

  it('builds the normaliser once per mount', async () => {
    const view = setUp();

    await submitCode(view, '123456');
    view.rerender();
    view.rerender();

    expect(constructed).toHaveBeenCalledTimes(1);
  });

  it('hands the loader, navigate and the from target to the submitter', () => {
    const from = { pathname: '/boards', search: '?a=1', hash: '' };

    setUp({ from, focusMain: false });

    const deps = mockDeps.mock.calls[0]?.[0] as ChallengeSubmitHookDeps;
    expect(deps.loader).toBe(loader);
    expect(deps.from).toEqual(from);
    expect(typeof deps.navigate).toBe('function');
  });

  it.each([[null], [{ focusMain: true }]])('has no from target for state %j', (state) => {
    setUp(state);

    expect((mockDeps.mock.calls[0]?.[0] as ChallengeSubmitHookDeps).from).toBeUndefined();
  });
});
