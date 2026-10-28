import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import type { TwoFactorFieldError } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import ChallengeCodeField from '@auth/components/two-factor/challenge-code-field';
import type { TwoFactorChallengeState } from '@auth/types/two-factor/challenge-view';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';

const RESTING: TwoFactorChallengeState = {
  mode: 'totp',
  value: '',
  fieldError: null,
  banner: null,
  bannerOccurrence: 0,
  focusRequest: 0,
  isSubmitting: false,
};

function Harness({ state }: { state: TwoFactorChallengeState }): JSX.Element {
  const methods = useForm<TwoFactorDto>({ defaultValues: { twoFactorCode: '' } });
  return (
    <I18nextProvider i18n={createLocaleI18n('uk')}>
      <FormProvider {...methods}>
        <ChallengeCodeField state={state} />
        <p aria-label="value">{methods.watch('twoFactorCode')}</p>
      </FormProvider>
    </I18nextProvider>
  );
}

const cells = (): HTMLInputElement[] => screen.getAllByRole('textbox');
const stored = (): string => screen.getByLabelText('value').textContent ?? '';

describe('ChallengeCodeField', () => {
  it('renders six cells named by position and a group named by the code label', () => {
    render(<Harness state={RESTING} />);

    expect(screen.getByRole('group', { name: 'Код підтвердження' })).toBeInTheDocument();
    expect(cells().map((cell) => cell.getAttribute('aria-label'))).toEqual([
      'Цифра 1 з 6',
      'Цифра 2 з 6',
      'Цифра 3 з 6',
      'Цифра 4 з 6',
      'Цифра 5 з 6',
      'Цифра 6 з 6',
    ]);
  });

  it.each<[TwoFactorFieldError, string]>([
    ['incomplete', 'Введіть усі 6 цифр коду'],
    ['format', 'Код має складатися лише з шести цифр'],
    [
      'invalid_code',
      'Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз.',
    ],
  ])('shows the %s text and marks every cell invalid', (fieldError, text) => {
    render(<Harness state={{ ...RESTING, fieldError }} />);

    expect(screen.getByText(text)).toBeInTheDocument();
    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-invalid', 'true'));
  });

  it('shows no error text and no invalid mark without a field error', () => {
    render(<Harness state={RESTING} />);

    cells().forEach((cell) => expect(cell).not.toHaveAttribute('aria-invalid', 'true'));
  });

  it('locks the cells while a request is in flight', () => {
    render(<Harness state={{ ...RESTING, isSubmitting: true }} />);

    cells().forEach((cell) => expect(cell).toHaveAttribute('aria-disabled', 'true'));
  });

  it('keeps typed digits when the value prop stays empty and nothing was requested', async () => {
    render(<Harness state={RESTING} />);

    await userEvent.type(cells()[0] as HTMLInputElement, '123');

    expect(stored()).toBe('123');
  });

  it('clears the stored code when the hook value is empty after a wrong code', async () => {
    const view = render(<Harness state={{ ...RESTING, value: '123456' }} />);
    await userEvent.type(cells()[0] as HTMLInputElement, '123456');
    expect(stored()).toBe('123456');

    view.rerender(<Harness state={{ ...RESTING, value: '', fieldError: 'invalid_code' }} />);

    await waitFor(() => expect(stored()).toBe(''));
  });

  it('clears the stored code on a new focus request while the hook value stays empty', async () => {
    const view = render(<Harness state={RESTING} />);
    await userEvent.type(cells()[0] as HTMLInputElement, '123456');
    expect(stored()).toBe('123456');

    view.rerender(<Harness state={{ ...RESTING, fieldError: 'invalid_code', focusRequest: 1 }} />);

    await waitFor(() => expect(stored()).toBe(''));
    await waitFor(() => cells().forEach((cell) => expect(cell).toHaveValue('')));
  });

  it('keeps typed digits when a focus is requested for a non-empty value', async () => {
    const view = render(<Harness state={{ ...RESTING, value: '12' }} />);
    await userEvent.type(cells()[0] as HTMLInputElement, '12');

    view.rerender(
      <Harness state={{ ...RESTING, value: '12', fieldError: 'incomplete', focusRequest: 1 }} />
    );

    await waitFor(() => expect(cells()[2]).toHaveFocus());
    expect(stored()).toBe('12');
  });

  it('does not focus a cell until a focus is requested', () => {
    render(<Harness state={RESTING} />);

    expect(document.body).toHaveFocus();
  });

  it('focuses the first empty cell once a focus is requested', async () => {
    const view = render(<Harness state={RESTING} />);
    await userEvent.type(cells()[0] as HTMLInputElement, '12');

    view.rerender(<Harness state={{ ...RESTING, focusRequest: 1 }} />);

    await waitFor(() => expect(cells()[2]).toHaveFocus());
  });
});
