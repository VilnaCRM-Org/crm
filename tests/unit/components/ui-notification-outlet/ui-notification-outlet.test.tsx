import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';
import { CLEARED_NOTIFICATION_OUTLET } from '@/lib/notifications/cleared-notification-outlet';
import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const success = { kind: 'success', messageKey: 'settings.toasts.saved' } as const;
const failure = { kind: 'error', messageKey: 'settings.toasts.save_failed' } as const;

interface HostProps {
  readonly withFallback?: boolean;
}

function Host({ withFallback = true }: HostProps): JSX.Element {
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <I18nextProvider i18n={createSettingsLocaleI18n('en')}>
      <h1 ref={heading} tabIndex={-1}>
        Settings
      </h1>
      <button type="button" ref={save}>
        Save
      </button>
      <UINotificationOutlet
        returnFocusRef={save}
        fallbackFocusRef={withFallback ? heading : undefined}
      />
    </I18nextProvider>
  );
}

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('en')}>{children}</I18nextProvider>
);

const portOf = (): ReturnType<typeof useNotifications> =>
  renderHook(() => useNotifications(), { wrapper }).result.current;

describe('UINotificationOutlet', () => {
  beforeEach(() => resetClientStores());

  it('holds one empty status region and one empty alert region before any raise', () => {
    render(<Host />);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByRole('alert')).toHaveAttribute('aria-atomic', 'true');
  });

  it('speaks a success in the status region and an error in the alert region only', () => {
    const port = portOf();
    render(<Host />);
    screen.getByRole('button', { name: 'Save' }).focus();

    act(() => port.raise({ items: [success, failure] }));

    expect(screen.getByRole('status')).toHaveTextContent(/^Changes saved/u);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The changes could not be saved. Please try again later.'
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('could not be saved');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Changes saved');
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('changes the text by the alternating mark on an identical repeat raise', () => {
    const port = portOf();
    render(<Host />);

    act(() => port.raise({ items: [success] }));
    const first = screen.getByRole('status').textContent;
    act(() => port.raise({ items: [success] }));
    const second = screen.getByRole('status').textContent;
    act(() => port.raise({ items: [success] }));
    const third = screen.getByRole('status').textContent;

    expect(first).toBe(`Changes saved${ALTERNATING_MARK}`);
    expect(second).toBe('Changes saved');
    expect(third).toBe(first);
  });

  it('publishes both focus return refs on mount', () => {
    render(<Host />);

    const { focus } = useNotificationOutletStore.getState();

    expect(focus?.primary.current).toBe(screen.getByRole('button', { name: 'Save' }));
    expect(focus?.fallback?.current).toBe(screen.getByRole('heading', { name: 'Settings' }));
  });

  it('publishes no fallback when none is given', () => {
    render(<Host withFallback={false} />);

    const { focus } = useNotificationOutletStore.getState();

    expect(focus?.primary.current).toBe(screen.getByRole('button', { name: 'Save' }));
    expect(focus?.fallback).toBeUndefined();
  });

  it('clears the whole outlet when it unmounts', () => {
    const port = portOf();
    const { unmount } = render(<Host />);
    act(() => port.raise({ items: [success, { ...failure, anchor: 'email' }] }));

    unmount();

    const state = useNotificationOutletStore.getState();
    expect(state.shown).toEqual(CLEARED_NOTIFICATION_OUTLET.shown);
    expect(state.raised).toEqual(CLEARED_NOTIFICATION_OUTLET.raised);
    expect(state.inline).toEqual(CLEARED_NOTIFICATION_OUTLET.inline);
    expect(state.announcement).toEqual({ polite: '', assertive: '' });
    expect(state.focus).toBeNull();
  });

  it('adds no notification region other than the two', () => {
    render(<Host />);

    expect(screen.queryAllByRole('status').length + screen.queryAllByRole('alert').length).toBe(2);
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
  });
});
