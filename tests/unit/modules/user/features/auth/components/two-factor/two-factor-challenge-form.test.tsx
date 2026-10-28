import '@testing-library/jest-dom';
import { act, render, screen, waitFor, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import TwoFactorChallengeForm from '@auth/components/two-factor/two-factor-challenge-form';
import type {
  TwoFactorChallengeProps,
  TwoFactorChallengeState,
} from '@auth/types/two-factor/challenge-view';
import createTwoFactorLocaleI18n from '@tests/unit/utils/create-two-factor-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const RESTING: TwoFactorChallengeState = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  bannerOccurrence: 0,
  focusRequest: 0,
  isSubmitting: false,
};

const callbacks = (): TwoFactorChallengeProps['callbacks'] => ({
  submit: jest.fn(),
  switchMode: jest.fn(),
});

const tree = (
  state: TwoFactorChallengeState,
  handlers: TwoFactorChallengeProps['callbacks'],
  locale: 'uk' | 'en' = 'uk'
): JSX.Element => (
  <I18nextProvider i18n={createTwoFactorLocaleI18n(locale)}>
    <main>
      <TwoFactorChallengeForm state={state} callbacks={handlers} />
    </main>
  </I18nextProvider>
);

const mount = (
  state: Partial<TwoFactorChallengeState> = {},
  handlers = callbacks(),
  locale: 'uk' | 'en' = 'uk'
): RenderResult & { handlers: TwoFactorChallengeProps['callbacks'] } => ({
  ...render(tree({ ...RESTING, ...state }, handlers, locale)),
  handlers,
});

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');

describe('TwoFactorChallengeForm', () => {
  it('shows the heading, subtitle, note, six labelled cells and the submit in Ukrainian', () => {
    mount();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Двофакторна автентифікація'
    );
    expect(
      screen.getByText('Введіть шестизначний код із застосунку Google Authenticator.')
    ).toBeInTheDocument();
    expect(screen.getByText('Код можна ввести протягом 5 хвилин після входу.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Код підтвердження' })).toBeInTheDocument();
    expect(cells()).toHaveLength(6);
    expect(cells()[0]).toHaveAccessibleName('Цифра 1 з 6');
    expect(cells()[5]).toHaveAccessibleName('Цифра 6 з 6');
    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeEnabled();
  });

  it('renders the English copy', () => {
    mount({}, callbacks(), 'en');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Two-factor authentication'
    );
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(cells()[0]).toHaveAccessibleName('Digit 1 of 6');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('puts focus on the h1 and renders only the submit and the mode toggle after it', () => {
    mount();

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.queryByRole('textbox', { name: /e-?mail|пошт/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/ще раз/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Підтвердити',
      'Використати резервний код',
    ]);
  });

  it('hands the typed six digits to submit once, only when the user submits', async () => {
    const { handlers } = mount();

    await userEvent.type(cells()[0] as HTMLInputElement, '123456');
    expect(handlers.submit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    await waitFor(() => expect(handlers.submit).toHaveBeenCalledTimes(1));
    expect(handlers.submit).toHaveBeenCalledWith({ twoFactorCode: '123456' });
  });

  it('hands a short value to submit too, so the hook can show the incomplete error', async () => {
    const { handlers } = mount();

    await userEvent.type(cells()[0] as HTMLInputElement, '1234');
    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    await waitFor(() => expect(handlers.submit).toHaveBeenCalledTimes(1));
    expect((handlers.submit as jest.Mock).mock.calls[0]?.[0]).toEqual({ twoFactorCode: '1234' });
  });

  it('marks the group invalid and describes it with the incomplete text', () => {
    mount({ fieldError: 'incomplete', value: '1234', focusRequest: 1 });

    const message = screen.getByText('Введіть усі 6 цифр коду');
    expect(message).toBeInTheDocument();
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
    expect(
      cells().some((cell) => cell.getAttribute('aria-describedby')?.includes(message.id))
    ).toBe(true);
  });

  it('moves focus to the first empty cell when a focus is requested', async () => {
    const handlers = callbacks();
    const view = mount({}, handlers);
    await userEvent.type(cells()[0] as HTMLInputElement, '1234');

    view.rerender(
      tree({ ...RESTING, fieldError: 'incomplete', value: '1234', focusRequest: 1 }, handlers)
    );

    await waitFor(() => expect(cells()[4]).toHaveFocus());
  });

  it('empties every cell and marks them invalid after a wrong code', async () => {
    const handlers = callbacks();
    const view = mount({}, handlers);
    await userEvent.type(cells()[0] as HTMLInputElement, '123456');
    view.rerender(tree({ ...RESTING, value: '123456' }, handlers));

    view.rerender(
      tree({ ...RESTING, value: '', fieldError: 'invalid_code', focusRequest: 1 }, handlers)
    );

    await waitFor(() => cells().forEach((cell) => expect(cell).toHaveValue('')));
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
    expect(
      screen.getByText(
        'Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз.'
      )
    ).toBeInTheDocument();
    await waitFor(() => expect(cells()[0]).toHaveFocus());
  });

  it('shows the format text for a malformed value', () => {
    mount({ fieldError: 'format' });

    expect(screen.getByText('Код має складатися лише з шести цифр')).toBeInTheDocument();
  });

  it('marks the form busy, announces the check and locks the cells while submitting', () => {
    mount({ isSubmitting: true, value: '123456' });

    expect(document.forms[0]).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Перевірка…')).toHaveAttribute('role', 'status');
    cells().forEach((cell) => {
      expect(cell).toHaveAttribute('aria-disabled', 'true');
      expect(cell).toHaveAttribute('readonly');
    });
  });

  it('shows the rate-limit banner as a focused alert without a retry', () => {
    mount({ banner: 'rate_limited' });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Забагато спроб. Зачекайте хвилину і спробуйте знову.');
    const banner = screen
      .getAllByRole('generic')
      .find((element) => element.tagName === 'SECTION' && element.contains(alert));
    expect(banner).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Спробувати ще раз' })).not.toBeInTheDocument();
  });

  it('retries through the form submit with the code as it is now, keeping focus', async () => {
    const handlers = callbacks();
    const transient = { banner: 'transient', bannerOccurrence: 1 } as const;
    const view = mount(transient, handlers);
    await userEvent.type(cells()[0] as HTMLInputElement, '654321');

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Не вдалося перевірити код. Перевірте з'єднання та спробуйте ще раз."
    );
    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    const pending = { ...RESTING, ...transient, value: '654321', isSubmitting: true };
    view.rerender(tree(pending, handlers));

    await waitFor(() => expect(handlers.submit).toHaveBeenCalledTimes(1));
    expect(handlers.submit).toHaveBeenCalledWith({ twoFactorCode: '654321' });
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toHaveFocus();
  });

  it('sends nothing from Retry while the previous check is still running', async () => {
    const { handlers } = mount({ banner: 'transient', bannerOccurrence: 1, isSubmitting: true });

    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(handlers.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('raises a new focused banner when the same failure happens again', async () => {
    const handlers = callbacks();
    const view = mount({ banner: 'transient', bannerOccurrence: 1 }, handlers);
    const first = screen.getByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    view.rerender(tree({ ...RESTING, banner: 'transient', bannerOccurrence: 2 }, handlers));

    const second = screen.getByRole('alert');
    const banner = screen
      .getAllByRole('generic')
      .find((element) => element.tagName === 'SECTION' && element.contains(second));
    expect(second).not.toBe(first);
    expect(banner).toHaveFocus();
  });

  it('shows no banner and no retry at rest', () => {
    mount();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['resting', {}],
    ['incomplete', { fieldError: 'incomplete', value: '12', focusRequest: 1 }],
    ['invalid code', { fieldError: 'invalid_code', focusRequest: 1 }],
    ['rate limited', { banner: 'rate_limited' }],
    ['transient', { banner: 'transient' }],
    ['busy', { isSubmitting: true }],
  ] as const)('has no accessibility violation in the %s state', async (_name, state) => {
    const { container } = mount(state);

    await act(async () => Promise.resolve());
    await expectNoA11yViolations(container);
  });

  it('ignores a focus request of zero', () => {
    mount({ focusRequest: 0 });

    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  describe('recovery mode', () => {
    it('shows the recovery subtitle, one labelled field and the way back to the app code', () => {
      mount({ mode: 'recovery' });

      expect(
        screen.getByText('Введіть один із резервних кодів, які ви зберегли під час налаштування.')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Введіть шестизначний код із застосунку Google Authenticator.')
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole('textbox')).toHaveLength(1);
      expect(screen.getByRole('textbox', { name: 'Резервний код' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Код підтвердження' })).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Використати код із застосунку' })
      ).toBeInTheDocument();
    });

    it('keeps the h1 and the note in both modes', () => {
      mount({ mode: 'recovery' });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Двофакторна автентифікація'
      );
      expect(
        screen.getByText('Код можна ввести протягом 5 хвилин після входу.')
      ).toBeInTheDocument();
    });

    it('hands the typed text to submit untouched, so the hook normalises it', async () => {
      const { handlers } = mount({ mode: 'recovery' });

      await userEvent.type(screen.getByRole('textbox', { name: 'Резервний код' }), 'abcd2345');
      await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

      await waitFor(() => expect(handlers.submit).toHaveBeenCalledTimes(1));
      expect(handlers.submit).toHaveBeenCalledWith({ twoFactorCode: 'abcd2345' });
    });

    it('asks the hook to switch mode when the toggle is activated', async () => {
      const { handlers } = mount({ mode: 'recovery' });

      await userEvent.click(screen.getByRole('button', { name: 'Використати код із застосунку' }));

      expect(handlers.switchMode).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['recovery resting', { mode: 'recovery' }],
      ['recovery busy', { mode: 'recovery', isSubmitting: true }],
    ] as const)('has no accessibility violation in the %s state', async (_name, state) => {
      const { container } = mount(state);

      await act(async () => Promise.resolve());
      await expectNoA11yViolations(container);
    });

    it.each([
      ['recovery format error', { mode: 'recovery', fieldError: 'format', focusRequest: 1 }],
      ['recovery wrong code', { mode: 'recovery', fieldError: 'invalid_code', focusRequest: 1 }],
    ] as const)('has no accessibility violation in the %s state', async (_name, state) => {
      const { container } = mount(state);

      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'Резервний код' })).toHaveFocus()
      );
      await expectNoA11yViolations(container);
    });
  });

  it('puts the mode toggle straight after the submit in the Tab order', async () => {
    mount();
    act(() => screen.getByRole('button', { name: 'Підтвердити' }).focus());

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Використати резервний код' })).toHaveFocus();
  });

  it('keeps the toggle inert while the code is being checked', async () => {
    const { handlers } = mount({ isSubmitting: true });

    await userEvent.click(screen.getByRole('button', { name: 'Використати резервний код' }));

    expect(handlers.switchMode).not.toHaveBeenCalled();
  });
});
