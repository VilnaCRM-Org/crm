import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { NotificationRecordSet } from '@/modules/user/features/notifications';
import Panel from '@/modules/user/features/notifications/components/notification-history-panel';
import { NOTIFICATION_SEED } from '@/modules/user/features/notifications/repositories';
import createI18n from '@tests/unit/utils/create-notification-center-locale-i18n';
import findLiveRegions from '@tests/unit/utils/find-live-regions';

const records: NotificationRecordSet = { items: NOTIFICATION_SEED.items };

function Host({
  locale,
  set = records,
  onMarkAllRead = jest.fn(),
}: {
  locale: 'uk' | 'en';
  set?: NotificationRecordSet;
  onMarkAllRead?: () => void;
}): JSX.Element {
  return (
    <I18nextProvider i18n={createI18n(locale, ['en', 'uk'])}>
      <Panel records={set} onMarkAllRead={onMarkAllRead} />
    </I18nextProvider>
  );
}

describe('NotificationHistoryPanel', () => {
  it('reads the seed in uk, newest first, with only the first row unread', () => {
    render(<Host locale="uk" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Сповіщення' })).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(within(rows[0] as HTMLElement).getByText('Ви успішно змінили пароль')).toBeVisible();
    expect(
      within(rows[1] as HTMLElement).getByText(
        'Ми надіслали посилання для підтвердження на нову адресу'
      )
    ).toBeVisible();
    expect(within(rows[2] as HTMLElement).getByText('Зміни збережено')).toBeVisible();
    expect(screen.getAllByText('Непрочитане')).toHaveLength(1);
    expect(within(rows[0] as HTMLElement).getByText('Непрочитане')).toBeInTheDocument();
  });

  it('reads the shipped en texts', () => {
    render(<Host locale="en" />);

    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('You have changed your password')).toBeVisible();
    expect(screen.getByText('We sent a confirmation link to the new address')).toBeVisible();
    expect(screen.getByText('Changes saved')).toBeVisible();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeEnabled();
  });

  it.each(['uk', 'en'] as const)('shows no raw key in %s', (locale) => {
    const { container } = render(<Host locale={locale} />);

    expect(container).not.toHaveTextContent('notification_center.');
    expect(container).not.toHaveTextContent('settings.');
  });

  it.each(['uk', 'en'] as const)('shows a formatted time on every row in %s', (locale) => {
    render(<Host locale={locale} />);

    for (const row of screen.getAllByRole('listitem')) {
      expect(row).toHaveTextContent(/\d{4}|\d{1,2}[:.]\d{2}/u);
      expect(row).not.toHaveTextContent('{{');
    }
  });

  it('marks unread by the record read flag of that id', () => {
    const set: NotificationRecordSet = {
      items: [
        { ...NOTIFICATION_SEED.items[0], read: true },
        { ...NOTIFICATION_SEED.items[1], read: false },
        { ...NOTIFICATION_SEED.items[2], read: false },
      ],
    } as NotificationRecordSet;
    render(<Host locale="en" set={set} />);
    const rows = screen.getAllByRole('listitem');

    expect(within(rows[0] as HTMLElement).queryByText('Unread')).not.toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('Unread')).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText('Unread')).toBeInTheDocument();
  });

  it('drops the unread mark when the same record comes back read', () => {
    const i18n = createI18n('en', ['en', 'uk']);
    const panelOf = (set: NotificationRecordSet): JSX.Element => (
      <I18nextProvider i18n={i18n}>
        <Panel records={set} onMarkAllRead={jest.fn()} />
      </I18nextProvider>
    );
    const { rerender } = render(panelOf(records));
    expect(screen.getAllByText('Unread')).toHaveLength(1);

    rerender(panelOf({ items: records.items.map((item) => ({ ...item, read: true })) }));

    expect(screen.queryByText('Unread')).not.toBeInTheDocument();
  });

  it('follows a language change with its heading, actions and unread text', async () => {
    const i18n = createI18n('uk', ['en', 'uk']);
    render(
      <I18nextProvider i18n={i18n}>
        <Panel records={records} onMarkAllRead={jest.fn()} />
      </I18nextProvider>
    );

    await act(() => i18n.changeLanguage('en'));

    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
  });

  it('runs the received mark-all handler once', async () => {
    const onMarkAllRead = jest.fn();
    render(<Host locale="uk" onMarkAllRead={onMarkAllRead} />);

    await userEvent.click(screen.getByRole('button', { name: 'Позначити всі прочитаними' }));

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('shows the empty text and no list item for an empty record set', () => {
    render(<Host locale="en" set={{ items: [] }} />);

    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('carries no live region, role other than structure, or time announcement', () => {
    const { container } = render(<Host locale="en" />);

    expect(findLiveRegions(container)).toEqual([]);
  });

  it('interpolates the message values a record carries', () => {
    const set: NotificationRecordSet = {
      items: [
        {
          id: 'notification-1',
          kind: 'success',
          messageKey: 'settings.social.linked',
          messageValues: { items: [{ name: 'provider', value: 'Google' }] },
          createdAt: Date.parse('2026-11-20T08:00:00Z'),
          read: false,
        },
      ],
    };

    render(<Host locale="en" set={set} />);

    expect(screen.getByText('You have linked Google')).toBeVisible();
  });

  it.each([
    ['lng', 'en'],
    ['ns', 'missing'],
    ['returnDetails', 'true'],
  ])('keeps a record value named %s an interpolation variable only', (name, value) => {
    const set: NotificationRecordSet = {
      items: [
        {
          id: 'notification-1',
          kind: 'success',
          messageKey: 'settings.social.linked',
          messageValues: {
            items: [
              { name, value },
              { name: 'provider', value: 'Google' },
            ],
          },
          createdAt: Date.parse('2026-11-20T08:00:00Z'),
          read: false,
        },
      ],
    };

    render(<Host locale="uk" set={set} />);

    expect(screen.getByText('Ви успішно підключили Google')).toBeVisible();
  });
});
