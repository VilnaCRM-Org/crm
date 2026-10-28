import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import ROUTE_PATHS from '@/routes/route-paths';
import TwoFactorFormSection from '@auth/routes/two-factor/two-factor-form-section';
import useAuthStore from '@auth/stores/use-auth-store';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import { buildPendingSessionId, buildToken } from '@tests/builders';
import createTwoFactorLocaleI18n from '@tests/unit/utils/create-two-factor-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const completeChallenge = jest.fn();
const challengeSettled = jest.fn();

jest.mock('@auth/hooks/use-auth-provider-loader', () => ({
  __esModule: true,
  default: (): { resolve: (token: symbol) => Promise<unknown> } => ({
    resolve: async (token: symbol): Promise<unknown> =>
      token === AUTH_TOKENS.GraphQLSignInProvider ? { completeChallenge } : { challengeSettled },
  }),
}));

jest.mock('@auth/assets/chevron-left.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

const i18n = createTwoFactorLocaleI18n('uk');
const FROM = { pathname: '/deals', search: '?tab=open', hash: '' };

function Probe(): JSX.Element {
  const { pathname, state } = useLocation();
  return <p>{`landed:${pathname}|${JSON.stringify(state)}`}</p>;
}

function mount(): ReturnType<typeof render> {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter
        initialEntries={[{ pathname: ROUTE_PATHS.twoFactorChallenge, state: { from: FROM } }]}
      >
        <Routes>
          <Route
            path={ROUTE_PATHS.twoFactorChallenge}
            element={
              <main>
                <TwoFactorFormSection />
              </main>
            }
          />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );
}

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');

const enter = async (digits: string): Promise<void> => {
  await userEvent.type(cells()[0] as HTMLInputElement, digits);
  await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
};

const failed = (reason: ChallengeFailureReason): ChallengeResult => ({ kind: 'failed', reason });

describe('TwoFactorFormSection', () => {
  const pendingSessionId = buildPendingSessionId();

  beforeEach(() => {
    resetClientStores();
    completeChallenge.mockReset();
    challengeSettled.mockReset();
    useAuthStore.setState({ pendingSessionId });
  });

  it('shows the card with Назад, the heading and the form, and has no violation', async () => {
    const { container } = mount();

    expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Двофакторна автентифікація'
    );
    await expectNoA11yViolations(container);
  });

  it('goes back to sign-in with the from target and the focus marker', async () => {
    mount();

    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect(
      await screen.findByText(
        `landed:${ROUTE_PATHS.signIn}|${JSON.stringify({ from: FROM, focusMain: true })}`
      )
    ).toBeInTheDocument();
  });

  it('shows the incomplete error and sends nothing for four digits', async () => {
    mount();

    await enter('1234');

    expect(await screen.findByText('Введіть усі 6 цифр коду')).toBeInTheDocument();
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(cells()[4]).toHaveFocus());
    expect(completeChallenge).not.toHaveBeenCalled();
  });

  it('completes with the session id and writes the token once', async () => {
    const token = buildToken();
    completeChallenge.mockResolvedValue({ kind: 'completed', token, recoveryCodesRemaining: 2 });
    mount();

    await enter('123456');

    await waitFor(() => expect(useAuthStore.getState().token).toBe(token));
    expect(completeChallenge).toHaveBeenCalledTimes(1);
    expect(completeChallenge).toHaveBeenCalledWith(
      { twoFactorCode: '123456', pendingSessionId },
      expect.any(AbortSignal)
    );
    expect(useAuthStore.getState()).toMatchObject({
      pendingSessionId: null,
      twoFactorStatus: 'enabled',
      recoveryCodesRemaining: 2,
    });
    expect(challengeSettled).toHaveBeenCalledTimes(1);
  });

  it('empties the cells and explains a wrong code, keeping the session', async () => {
    completeChallenge.mockResolvedValue(failed('invalid_code'));
    mount();

    await enter('123456');

    expect(
      await screen.findByText(
        'Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз.'
      )
    ).toBeInTheDocument();
    await waitFor(() => cells().forEach((cell) => expect(cell).toHaveValue('')));
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(cells()[0]).toHaveFocus());
    expect(useAuthStore.getState().pendingSessionId).toBe(pendingSessionId);
  });

  it.each([
    ['expired_session', 'two_factor_expired'],
    ['locked', 'account_locked'],
  ] as const)('leaves for sign-in with the %s notice', async (reason, notice) => {
    completeChallenge.mockResolvedValue(failed(reason));
    mount();

    await enter('123456');

    expect(
      await screen.findByText(
        `landed:${ROUTE_PATHS.signIn}|${JSON.stringify({ from: FROM, focusMain: true, notice })}`
      )
    ).toBeInTheDocument();
  });

  it('shows the rate-limit banner without a retry', async () => {
    completeChallenge.mockResolvedValue(failed('rate_limited'));
    mount();

    await enter('123456');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Забагато спроб. Зачекайте хвилину і спробуйте знову.'
    );
    expect(screen.queryByRole('button', { name: 'Спробувати ще раз' })).not.toBeInTheDocument();
  });

  it('retries a server failure with exactly one more identical request', async () => {
    completeChallenge.mockResolvedValueOnce(failed('server'));
    completeChallenge.mockResolvedValueOnce({
      kind: 'completed',
      token: buildToken(),
      recoveryCodesRemaining: null,
    });
    mount();
    await enter('123456');

    await userEvent.click(await screen.findByRole('button', { name: 'Спробувати ще раз' }));

    await waitFor(() => expect(completeChallenge).toHaveBeenCalledTimes(2));
    expect(completeChallenge.mock.calls[1]?.[0]).toEqual(completeChallenge.mock.calls[0]?.[0]);
  });

  it('aborts a request in flight when Назад is activated and records nothing', async () => {
    let signal: AbortSignal | undefined;
    completeChallenge.mockImplementation(
      (_input: unknown, abortSignal: AbortSignal) =>
        new Promise(() => {
          signal = abortSignal;
        })
    );
    mount();
    await enter('123456');
    await waitFor(() => expect(signal).toBeDefined());

    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));

    await screen.findByText(/^landed:\/sign-in\|/);
    expect(signal?.aborted).toBe(true);
    expect(challengeSettled).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('recovery code', () => {
    const recoveryField = (): HTMLInputElement =>
      screen.getByRole('textbox', { name: 'Резервний код' });

    const openRecovery = async (): Promise<void> => {
      await userEvent.click(screen.getByRole('button', { name: 'Використати резервний код' }));
      await waitFor(() => expect(recoveryField()).toHaveFocus());
    };

    const submitRecovery = async (text: string): Promise<void> => {
      await userEvent.type(recoveryField(), text);
      await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    };

    it('replaces the cells with the labelled field, focused, and swaps the toggle', async () => {
      mount();

      await openRecovery();

      expect(screen.getAllByRole('textbox')).toHaveLength(1);
      expect(
        screen.getByText('Введіть один із резервних кодів, які ви зберегли під час налаштування.')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Використати код із застосунку' })
      ).toBeInTheDocument();
    });

    it.each(['abcd2345', 'abcd-2345', ' AbCd 2345 '])('sends %j as ABCD-2345', async (typed) => {
      completeChallenge.mockResolvedValue(failed('server'));
      mount();
      await openRecovery();

      await submitRecovery(typed);

      await waitFor(() => expect(completeChallenge).toHaveBeenCalledTimes(1));
      expect(completeChallenge).toHaveBeenCalledWith(
        { twoFactorCode: 'ABCD-2345', pendingSessionId },
        expect.any(AbortSignal)
      );
    });

    it('shows the format error and sends nothing for a malformed code', async () => {
      mount();
      await openRecovery();

      await submitRecovery('abc-123');

      expect(
        await screen.findByText('Введіть резервний код у форматі XXXX-XXXX')
      ).toBeInTheDocument();
      expect(recoveryField()).toHaveAttribute('aria-invalid', 'true');
      expect(completeChallenge).not.toHaveBeenCalled();
    });

    it('empties the field and explains a wrong recovery code, keeping focus in it', async () => {
      completeChallenge.mockResolvedValue(failed('invalid_code'));
      mount();
      await openRecovery();

      await submitRecovery('abcd2345');

      const message = await screen.findByText('Невірний резервний код. Спробуйте ще раз.');
      await waitFor(() => expect(recoveryField()).toHaveValue(''));
      expect(recoveryField()).toHaveAttribute('aria-invalid', 'true');
      expect(recoveryField()).toHaveAccessibleDescription(message.textContent ?? '');
      await waitFor(() => expect(recoveryField()).toHaveFocus());
      expect(useAuthStore.getState().pendingSessionId).toBe(pendingSessionId);
    });

    it('returns to the cells with the first one focused and nothing left over', async () => {
      mount();
      await openRecovery();
      await userEvent.type(recoveryField(), 'abc');

      await userEvent.click(screen.getByRole('button', { name: 'Використати код із застосунку' }));

      await waitFor(() => expect(cells()).toHaveLength(6));
      await waitFor(() => expect(cells()[0]).toHaveFocus());
      cells().forEach((cell) => expect(cell).toHaveValue(''));
      expect(
        screen.queryByText('Введіть резервний код у форматі XXXX-XXXX')
      ).not.toBeInTheDocument();
    });

    it('completes with a recovery code and writes the token', async () => {
      const token = buildToken();
      completeChallenge.mockResolvedValue({ kind: 'completed', token, recoveryCodesRemaining: 1 });
      mount();
      await openRecovery();

      await submitRecovery('abcd0001');

      await waitFor(() => expect(useAuthStore.getState().token).toBe(token));
      expect(completeChallenge.mock.calls[0]?.[0]).toEqual({
        twoFactorCode: 'ABCD-0001',
        pendingSessionId,
      });
      expect(useAuthStore.getState().recoveryCodesRemaining).toBe(1);
    });
  });
});
