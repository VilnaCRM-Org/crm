import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import type { TwoFactorFieldError } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import RecoveryCodeField from '@auth/components/two-factor/recovery-code-field';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const RESTING: TwoFactorChallengeState = {
  mode: 'recovery',
  value: '',
  fieldError: null,
  banner: null,
  focusRequest: 0,
  isSubmitting: false,
};

function Harness({
  state,
  locale = 'uk',
}: {
  state: TwoFactorChallengeState;
  locale?: 'uk' | 'en';
}): JSX.Element {
  const methods = useForm<TwoFactorDto>({ defaultValues: { twoFactorCode: '' } });
  return (
    <I18nextProvider i18n={createLocaleI18n(locale)}>
      <FormProvider {...methods}>
        <main>
          <RecoveryCodeField state={state} />
          <output aria-label="value">{methods.watch('twoFactorCode')}</output>
        </main>
      </FormProvider>
    </I18nextProvider>
  );
}

const field = (): HTMLInputElement => screen.getByRole('textbox', { name: 'Резервний код' });
const stored = (): string => screen.getByLabelText('value').textContent ?? '';

describe('RecoveryCodeField', () => {
  it('renders one labelled field with the format helper and no placeholder', () => {
    render(<Harness state={RESTING} />);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(field()).toHaveAttribute('id', 'twoFactorCode');
    expect(field()).not.toHaveAttribute('placeholder');
    expect(screen.getByText('Формат: XXXX-XXXX')).toBeInTheDocument();
    expect(field()).toHaveAccessibleDescription('Формат: XXXX-XXXX');
  });

  it('renders the English label and helper', () => {
    render(<Harness state={RESTING} locale="en" />);

    expect(screen.getByRole('textbox', { name: 'Recovery code' })).toBeInTheDocument();
    expect(screen.getByText('Format: XXXX-XXXX')).toBeInTheDocument();
  });

  it('asks the browser for no autofill and no spell checking, with upper-case capitals', () => {
    render(<Harness state={RESTING} />);

    expect(field()).toHaveAttribute('autocomplete', 'off');
    expect(field()).toHaveAttribute('autocapitalize', 'characters');
    expect(field()).toHaveAttribute('spellcheck', 'false');
  });

  it('stores what the user types', async () => {
    render(<Harness state={RESTING} />);

    await userEvent.type(field(), 'abcd2345');

    expect(stored()).toBe('abcd2345');
  });

  it('locks the field while a request is in flight', () => {
    render(<Harness state={{ ...RESTING, isSubmitting: true }} />);

    expect(field()).toBeDisabled();
  });

  it.each<[TwoFactorFieldError, string]>([
    ['format', 'Введіть резервний код у форматі XXXX-XXXX'],
    ['incomplete', 'Введіть резервний код у форматі XXXX-XXXX'],
    ['invalid_code', 'Невірний резервний код. Спробуйте ще раз.'],
  ])('shows the %s text, marks the field invalid and describes it', async (fieldError, text) => {
    render(<Harness state={{ ...RESTING, fieldError }} />);

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription(text);
  });

  it('renders the error text in the accessible error text colour', async () => {
    render(<Harness state={{ ...RESTING, fieldError: 'format' }} />);

    const error = await screen.findByText('Введіть резервний код у форматі XXXX-XXXX');

    expect(error).toHaveStyle({ color: 'rgb(198, 40, 40)' });
  });

  it('clears the error text when the hook error goes away', async () => {
    const view = render(<Harness state={{ ...RESTING, fieldError: 'format' }} />);
    await screen.findByText('Введіть резервний код у форматі XXXX-XXXX');

    view.rerender(<Harness state={RESTING} />);

    await waitFor(() => expect(field()).not.toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('Формат: XXXX-XXXX')).toBeInTheDocument();
  });

  it('empties the field and focuses it after a wrong code', async () => {
    const view = render(<Harness state={RESTING} />);
    await userEvent.type(field(), 'abcd2345');

    view.rerender(<Harness state={{ ...RESTING, fieldError: 'invalid_code', focusRequest: 1 }} />);

    await waitFor(() => expect(stored()).toBe(''));
    await waitFor(() => expect(field()).toHaveFocus());
    expect(field()).toHaveValue('');
  });

  it('keeps typed text when a focus is requested for a non-empty value', async () => {
    const view = render(<Harness state={{ ...RESTING, value: 'abc' }} />);
    await userEvent.type(field(), 'abc');

    view.rerender(
      <Harness state={{ ...RESTING, value: 'abc', fieldError: 'format', focusRequest: 1 }} />
    );

    await waitFor(() => expect(field()).toHaveFocus());
    expect(stored()).toBe('abc');
  });

  it('does not take focus until a focus is requested', () => {
    render(<Harness state={RESTING} />);

    expect(document.body).toHaveFocus();
  });

  it.each([
    ['resting', {}],
    ['format error', { fieldError: 'format' }],
    ['wrong code', { fieldError: 'invalid_code', focusRequest: 1 }],
    ['busy', { isSubmitting: true }],
  ] as const)('has no accessibility violation in the %s state', async (_name, state) => {
    const { container } = render(<Harness state={{ ...RESTING, ...state }} />);

    await screen.findByRole('main');
    await expectNoA11yViolations(container);
  });
});
