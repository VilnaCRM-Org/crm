import { renderHook } from '@testing-library/react';
import * as React from 'react';
import type { JSX, ReactNode } from 'react';
import * as ReactI18next from 'react-i18next';
import { I18nextProvider } from 'react-i18next';

import useCodesFormProps from '@/modules/user/features/settings/hooks/use-codes-form-props';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import loadIsolated from '@tests/unit/utils/isolated-module';

import { panelProps } from '../components/two-factor-settings/render-panel';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

describe('useCodesFormProps', () => {
  it('hands done to the form and starts with no values', () => {
    const props = panelProps();

    const { result } = renderHook(() => useCodesFormProps(props, false), { wrapper });

    expect(result.current.onSubmit).toBe(props.callbacks.done);
    expect(result.current.defaultValues).toEqual({});
  });

  it('evaluates the empty defaults in a hook loaded inside the test', async () => {
    const fresh = await loadIsolated(async () => {
      jest.doMock('react', () => React);
      jest.doMock('react-i18next', () => ReactI18next);
      return (await import('@/modules/user/features/settings/hooks/use-codes-form-props')).default;
    });

    const { result } = renderHook(() => fresh(panelProps(), false), { wrapper });

    expect(result.current.defaultValues).toStrictEqual({});
  });

  it('carries the translated title, subtitle and labels', () => {
    const { result } = renderHook(() => useCodesFormProps(panelProps(), false), { wrapper });

    expect(result.current).toMatchObject({
      title: 'Резервні коди',
      subtitle: expect.stringContaining('Збережіть ці коди в надійному місці.'),
      submitLabel: 'Готово',
      submittingLabel: 'Завершуємо…',
    });
  });

  it('blocks the submit with the reason until the codes are acknowledged', () => {
    const { result: blocked } = renderHook(() => useCodesFormProps(panelProps(), false), {
      wrapper,
    });
    const { result: saved } = renderHook(() => useCodesFormProps(panelProps(), true), { wrapper });

    expect(blocked.current.submitBlockedReason).toBe('Спочатку підтвердьте, що зберегли коди');
    expect(saved.current.submitBlockedReason).toBeUndefined();
  });

  it('gives a title ref that focuses the node it receives', () => {
    const { result } = renderHook(() => useCodesFormProps(panelProps(), false), { wrapper });
    const node = document.createElement('h3');
    const focus = jest.spyOn(node, 'focus');

    (result.current.titleRef as (element: HTMLElement | null) => void)(node);

    expect(focus).toHaveBeenCalledTimes(1);
  });
});
