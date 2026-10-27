import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useSetupFormProps from '@/modules/user/features/settings/hooks/use-setup-form-props';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps, viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

describe('useSetupFormProps', () => {
  it('hands the confirm callback to the form and starts with an empty code', () => {
    const props = panelProps({ view: viewState('setup') });

    const { result } = renderHook(() => useSetupFormProps(props), { wrapper });

    expect(result.current.onSubmit).toBe(props.callbacks.confirm);
    expect(result.current.defaultValues).toEqual({ twoFactorCode: '' });
  });

  it('carries the translated title, subtitle and submit labels', () => {
    const { result } = renderHook(() => useSetupFormProps(panelProps()), { wrapper });

    expect(result.current).toMatchObject({
      title: 'Налаштуйте двофакторну автентифікацію',
      subtitle: 'Випадковий код з обмеженням за часом, який створює застосунок.',
      submitLabel: 'Підтвердити',
      submittingLabel: 'Перевірка…',
    });
  });

  it('has no banner by default', () => {
    const { result } = renderHook(() => useSetupFormProps(panelProps()), { wrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.errorAction).toBeUndefined();
  });

  it('turns the transient banner into an error with a Retry wired to retry', () => {
    const props = panelProps({ view: viewState('setup', { banner: 'transient' }) });
    const { result } = renderHook(() => useSetupFormProps(props), { wrapper });

    expect(result.current.error).toContain('Не вдалося виконати дію');
    result.current.errorAction?.onClick();

    expect(props.callbacks.retry).toHaveBeenCalledTimes(1);
  });

  it('turns the rate-limited banner into an error with no Retry', () => {
    const props = panelProps({ view: viewState('setup', { banner: 'rate_limited' }) });
    const { result } = renderHook(() => useSetupFormProps(props), { wrapper });

    expect(result.current.error).toContain('Забагато спроб');
    expect(result.current.errorAction).toBeUndefined();
  });

  it('gives a title ref that focuses the node it receives', () => {
    const { result } = renderHook(() => useSetupFormProps(panelProps()), { wrapper });
    const node = document.createElement('h3');
    const focus = jest.spyOn(node, 'focus');

    (result.current.titleRef as (element: HTMLElement | null) => void)(node);

    expect(focus).toHaveBeenCalledTimes(1);
  });
});
