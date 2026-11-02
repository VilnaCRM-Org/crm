import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useCodeFormProps from '@/modules/user/features/settings/hooks/use-code-form-props';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const COPY = {
  title: 'settings.two_factor.disable.title',
  subtitle: 'settings.two_factor.disable.description',
  submit: 'settings.two_factor.disable.submit',
  submitting: 'settings.two_factor.disable.submitting',
};

describe('useCodeFormProps', () => {
  it('hands the given callback to the form and starts with an empty code', () => {
    const props = panelProps();
    const onSubmit = jest.fn();

    const { result } = renderHook(() => useCodeFormProps(props, onSubmit, COPY), { wrapper });

    expect(result.current.onSubmit).toBe(onSubmit);
    expect(result.current.defaultValues).toEqual({ twoFactorCode: '' });
  });

  it('translates the four copy keys it is given', () => {
    const { result } = renderHook(() => useCodeFormProps(panelProps(), jest.fn(), COPY), {
      wrapper,
    });

    expect(result.current).toMatchObject({
      title: 'Вимкнути двофакторну автентифікацію',
      subtitle: 'Введіть код із застосунку або резервний код.',
      submitLabel: 'Вимкнути',
      submittingLabel: 'Вимикаємо…',
    });
  });
});
