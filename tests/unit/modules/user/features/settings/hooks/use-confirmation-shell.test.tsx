import { renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useConfirmationShell from '@/modules/user/features/settings/hooks/use-confirmation-shell';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

import { panelProps, viewState } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

describe('useConfirmationShell', () => {
  it('has no banner by default and carries the submit ref', () => {
    const { result } = renderHook(() => useConfirmationShell(panelProps()), { wrapper });

    expect(result.current.error).toBeNull();
    expect(result.current.errorAction).toBeUndefined();
    expect(result.current.submitRef).toEqual({ current: null });
  });

  it('turns the transient banner into an error with a Retry and carries its occurrence', () => {
    const props = panelProps({
      view: viewState('setup', { banner: 'transient', bannerOccurrence: 3 }),
    });
    const { result } = renderHook(() => useConfirmationShell(props), { wrapper });

    expect(result.current.error).toContain('Не вдалося виконати дію');
    expect(result.current.errorAction?.label).toBe('Спробувати ще раз');
    expect(result.current.errorOccurrence).toBe(3);
  });

  it('gives a title ref that focuses the node it receives', () => {
    const { result } = renderHook(() => useConfirmationShell(panelProps()), { wrapper });
    const node = document.createElement('h3');
    const focus = jest.spyOn(node, 'focus');

    (result.current.titleRef as (element: HTMLElement | null) => void)(node);

    expect(focus).toHaveBeenCalledTimes(1);
  });
});
