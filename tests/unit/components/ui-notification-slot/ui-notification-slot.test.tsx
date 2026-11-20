import '@testing-library/jest-dom';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactNode, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import UINotificationSlot from '@/components/ui-notification-slot';
import useNotifications from '@/hooks/use-notifications';
import type { NotificationDraft } from '@/lib/notifications/types/notification-draft';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('en')}>{children}</I18nextProvider>
);

const saved: NotificationDraft = { kind: 'success', messageKey: 'settings.toasts.saved' };

const retryDraft = (onActivate: () => void, anchor?: string): NotificationDraft => ({
  kind: 'error',
  messageKey: 'settings.toasts.save_failed_transient',
  action: { labelKey: 'notifications.error.retry_button', onActivate },
  anchor,
});

function Page({ anchors = ['primary'] }: { anchors?: readonly string[] }): JSX.Element {
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
      {anchors.map((anchor) => (
        <UINotificationSlot key={anchor} anchor={anchor} />
      ))}
      <UINotificationOutlet returnFocusRef={save} fallbackFocusRef={heading} />
    </I18nextProvider>
  );
}

const portOf = (): ReturnType<typeof useNotifications> =>
  renderHook(() => useNotifications(), { wrapper }).result.current;

const useStyle = (style: string): void => {
  writeConfigBlock(JSON.stringify({ notificationStyle: style }));
};

describe('UINotificationSlot', () => {
  beforeEach(() => resetClientStores());

  afterEach(() => clearConfigBlock());

  it('shows the batch raised for its anchor under inline', () => {
    useStyle('inline');
    const port = portOf();
    render(<Page anchors={['primary', 'email']} />);

    act(() => port.raise({ items: [saved, { ...saved, anchor: 'email' }] }));

    const lists = screen.getAllByRole('list');

    expect(lists).toHaveLength(2);
    for (const list of lists) {
      expect(within(list).getByText('Changes saved')).toBeInTheDocument();
    }
  });

  it('shows nothing at a slot whose anchor received no batch', () => {
    useStyle('inline');
    const port = portOf();
    render(<Page anchors={['primary', 'email']} />);

    act(() => port.raise({ items: [saved] }));

    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(within(screen.getByRole('list')).getByText('Changes saved')).toBeInTheDocument();
  });

  it.each(['toast', 'bell'])('renders nothing under %s even with a batch', (style) => {
    useStyle(style);
    const port = portOf();
    render(<Page />);

    act(() => port.raise({ items: [saved] }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders nothing under the default style when no block exists', () => {
    const port = portOf();
    render(<Page />);

    act(() => port.raise({ items: [saved] }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows only the newest batch and nothing after withdraw', () => {
    useStyle('inline');
    const port = portOf();
    render(<Page />);

    act(() => port.raise({ items: [saved] }));
    act(() => port.raise({ items: [{ ...saved, messageKey: 'settings.toasts.resent' }] }));

    const list = screen.getByRole('list');
    expect(within(list).queryByText('Changes saved')).not.toBeInTheDocument();
    expect(within(list).getByText('The confirmation link has been sent again')).toBeInTheDocument();
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);

    act(() => port.withdraw('primary'));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('places the block 16 px below the action row, and 8 px for the email anchor', () => {
    useStyle('inline');
    const port = portOf();
    render(<Page anchors={['primary', 'email']} />);

    act(() => port.raise({ items: [saved, { ...saved, anchor: 'email' }] }));
    const margins = screen
      .getAllByRole('generic')
      .map((node) => getComputedStyle(node).marginTop)
      .filter((margin) => margin !== '');

    expect(margins).toEqual(['1rem', '0.5rem']);
  });

  it('on Retry focuses the primary target, withdraws and runs the action once', async () => {
    useStyle('inline');
    const port = portOf();
    const seen: boolean[] = [];
    const onActivate = jest.fn((): void => {
      seen.push(screen.getByRole('button', { name: 'Save' }).matches(':focus'));
    });
    render(<Page />);
    act(() => port.raise({ items: [retryDraft(onActivate)] }));

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([true]);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('falls back to the published fallback when the primary target is disabled', async () => {
    useStyle('inline');
    const port = portOf();
    render(<Page />);
    act(() => port.raise({ items: [retryDraft(jest.fn())] }));
    screen.getByRole('button', { name: 'Save' }).setAttribute('disabled', '');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toHaveFocus();
  });

  it('still runs the action and withdraws when no focus target was published', async () => {
    useStyle('inline');
    const port = portOf();
    const onActivate = jest.fn();
    render(
      <I18nextProvider i18n={createSettingsLocaleI18n('en')}>
        <UINotificationSlot anchor="primary" />
      </I18nextProvider>
    );
    act(() => port.raise({ items: [retryDraft(onActivate)] }));

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('keeps a line without an action free of any button', () => {
    useStyle('inline');
    const port = portOf();
    render(<Page />);

    act(() => port.raise({ items: [saved] }));

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
