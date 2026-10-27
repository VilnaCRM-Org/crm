import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useDisableFormProps from '@/modules/user/features/settings/hooks/use-disable-form-props';
import useRegenerate from '@/modules/user/features/settings/hooks/use-regenerate-form-props';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps, viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

describe('useDisableFormProps', () => {
  it('hands disable to the form, starting with an empty code', () => {
    const props = panelProps({ view: viewState('disable') });

    const { result } = renderHook(() => useDisableFormProps(props), { wrapper });

    expect(result.current.onSubmit).toBe(props.callbacks.disable);
    expect(result.current.defaultValues).toEqual({ twoFactorCode: '' });
  });

  it('carries the translated copy', () => {
    const { result } = renderHook(() => useDisableFormProps(panelProps()), { wrapper });

    expect(result.current).toMatchObject({
      title: 'Вимкнути двофакторну автентифікацію',
      subtitle: 'Введіть код із застосунку або резервний код.',
      submitLabel: 'Вимкнути',
      submittingLabel: 'Вимикаємо…',
    });
  });

  it('maps the banners and focuses the title ref', () => {
    const props = panelProps({ view: viewState('disable', { banner: 'transient' }) });
    const { result } = renderHook(() => useDisableFormProps(props), { wrapper });
    const node = document.createElement('h3');
    const focus = jest.spyOn(node, 'focus');

    result.current.errorAction?.onClick();
    (result.current.titleRef as (element: HTMLElement | null) => void)(node);

    expect(result.current.error).toContain('Не вдалося виконати дію');
    expect(props.callbacks.retry).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('has no banner by default', () => {
    const { result } = renderHook(() => useDisableFormProps(panelProps()), { wrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.errorAction).toBeUndefined();
  });
});

describe('useRegenerateFormProps', () => {
  it('hands regenerate to the form with no values', () => {
    const props = panelProps({ view: viewState('regenerate') });

    const { result } = renderHook(() => useRegenerate(props), { wrapper });

    expect(result.current.onSubmit).toBe(props.callbacks.regenerate);
    expect(result.current.defaultValues).toEqual({});
  });

  it('carries the translated copy', () => {
    const { result } = renderHook(() => useRegenerate(panelProps()), { wrapper });

    expect(result.current).toMatchObject({
      title: 'Створити нові резервні коди',
      subtitle: 'Старі резервні коди перестануть діяти. Продовжити?',
      submitLabel: 'Створити коди',
      submittingLabel: 'Створюємо…',
    });
  });

  it('maps the banners and focuses the title ref', () => {
    const props = panelProps({ view: viewState('regenerate', { banner: 'rate_limited' }) });
    const { result } = renderHook(() => useRegenerate(props), { wrapper });
    const node = document.createElement('h3');
    const focus = jest.spyOn(node, 'focus');

    (result.current.titleRef as (element: HTMLElement | null) => void)(node);

    expect(result.current.error).toContain('Забагато спроб');
    expect(result.current.errorAction).toBeUndefined();
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
