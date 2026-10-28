import { render, renderHook, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useChallengeFormProps from '@auth/hooks/use-challenge-form-props';
import type { TwoFactorChallengeProps } from '@auth/types/two-factor/challenge-view';
import createTwoFactorLocaleI18n from '@tests/unit/utils/create-two-factor-locale-i18n';

interface WrapperProps {
  readonly children: ReactNode;
}

function I18nWrapper({ children }: WrapperProps): JSX.Element {
  return <I18nextProvider i18n={createTwoFactorLocaleI18n('uk')}>{children}</I18nextProvider>;
}

const propsOf = (
  overrides: Partial<TwoFactorChallengeProps['state']> = {}
): TwoFactorChallengeProps => ({
  state: {
    mode: 'totp',
    value: '',
    fieldError: null,
    banner: null,
    bannerOccurrence: 0,
    focusRequest: 0,
    isSubmitting: false,
    ...overrides,
  },
  callbacks: { submit: jest.fn(), switchMode: jest.fn() },
});

describe('useChallengeFormProps', () => {
  it('wires the submit callback and an empty code as the form defaults', () => {
    const props = propsOf();
    const { result } = renderHook(() => useChallengeFormProps(props), { wrapper: I18nWrapper });

    expect(result.current.onSubmit).toBe(props.callbacks.submit);
    expect(result.current.defaultValues).toEqual({ twoFactorCode: '' });
  });

  it('carries the copy of the current mode', () => {
    const { result } = renderHook(() => useChallengeFormProps(propsOf({ mode: 'recovery' })), {
      wrapper: I18nWrapper,
    });

    expect(result.current).toMatchObject({
      title: 'Двофакторна автентифікація',
      subtitle: 'Введіть один із резервних кодів, які ви зберегли під час налаштування.',
      submitLabel: 'Підтвердити',
      submittingLabel: 'Перевірка…',
    });
  });

  it('carries the banner text, its occurrence and a retry that needs a submit button', () => {
    const props = propsOf({ banner: 'transient', bannerOccurrence: 3 });
    const { result } = renderHook(() => useChallengeFormProps(props), { wrapper: I18nWrapper });

    expect(result.current.error).toBe(
      "Не вдалося перевірити код. Перевірте з'єднання та спробуйте ще раз."
    );
    expect(result.current.errorOccurrence).toBe(3);
    expect(result.current.errorAction?.label).toBe('Спробувати ще раз');
    expect(result.current.submitRef).toEqual({ current: null });
    expect(() => result.current.errorAction?.onClick()).not.toThrow();
    expect(props.callbacks.submit).not.toHaveBeenCalled();
  });

  it('has no banner at rest', () => {
    const { result } = renderHook(() => useChallengeFormProps(propsOf()), { wrapper: I18nWrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.errorAction).toBeUndefined();
  });

  it('puts the mode toggle in the footer, busy while submitting', () => {
    const props = propsOf({ isSubmitting: true });
    const { result } = renderHook(() => useChallengeFormProps(props), { wrapper: I18nWrapper });

    render(<I18nWrapper>{result.current.footer}</I18nWrapper>);

    expect(screen.getByRole('button', { name: 'Використати резервний код' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('puts the note in the notice slot and gives a focus ref for the title', () => {
    const { result } = renderHook(() => useChallengeFormProps(propsOf()), { wrapper: I18nWrapper });

    render(<>{result.current.notice}</>);

    expect(screen.getByText('Код можна ввести протягом 5 хвилин після входу.')).toBeInTheDocument();
    expect(typeof result.current.titleRef).toBe('function');
  });
});
