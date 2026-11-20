import { renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useSetupFormProps from '@/modules/user/features/settings/hooks/use-setup-form-props';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

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

  it('leaves the title and subtitle to the card header and carries the submit labels', () => {
    const { result } = renderHook(() => useSetupFormProps(panelProps()), { wrapper });

    expect(result.current).toMatchObject({
      showTitle: false,
      showSubtitle: false,
      submitLabel: 'Підтвердити',
      submittingLabel: 'Перевірка…',
    });
  });

  it('has no banner by default', () => {
    const { result } = renderHook(() => useSetupFormProps(panelProps()), { wrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.errorAction).toBeUndefined();
  });

  it('turns the transient banner into an error with a Retry through the submit ref', () => {
    const props = panelProps({
      view: viewState('setup', { banner: 'transient', bannerOccurrence: 4 }),
    });
    const { result } = renderHook(() => useSetupFormProps(props), { wrapper });

    expect(result.current.error).toContain('Не вдалося надіслати запит');
    expect(result.current.errorAction?.label).toBe('Спробувати ще раз');
    expect(result.current.errorOccurrence).toBe(4);
    expect(result.current.submitRef).toEqual({ current: null });
    expect(() => result.current.errorAction?.onClick()).not.toThrow();
    expect(props.callbacks.confirm).not.toHaveBeenCalled();
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

  it('evaluates the setup copy in a hook loaded inside the test', async () => {
    const fresh = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/hooks/use-setup-form-props')).default;
    });
    const i18n = createSettingsLocaleI18n('uk', ['en']);

    const { result } = renderHook(() => fresh(panelProps()), { wrapper });

    expect(result.current).toMatchObject({
      title: i18n.t('settings.two_factor.setup.title'),
      subtitle: i18n.t('settings.two_factor.setup.subtitle'),
      submitLabel: 'Підтвердити',
      submittingLabel: 'Перевірка…',
    });
    expect(result.current.title).not.toBe('settings.two_factor.setup.title');
    expect(result.current.subtitle).not.toBe('settings.two_factor.setup.subtitle');
  });
});
