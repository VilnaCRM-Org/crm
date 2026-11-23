import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { NotificationHistoryCopy } from '@/components/types/ui-notification-history';
import UINotificationHistory from '@/components/ui-notification-history';
import type { NotificationViewSet } from '@/lib/notifications/types/notification-view';
import createContentI18n from '@tests/unit/utils/create-notification-content-locale-i18n';

const copy: NotificationHistoryCopy = {
  heading: 'Сповіщення',
  empty: 'Сповіщень ще немає',
  markAllRead: 'Позначити всі прочитаними',
  unread: 'Непрочитане',
};

const views: NotificationViewSet = {
  items: [
    { id: 'a', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:15' },
    { id: 'b', kind: 'error', message: 'Не вдалося зберегти', time: '10 листопада, 09:10' },
    { id: 'c', kind: 'success', message: 'Зміни збережено', time: '9 листопада, 18:00' },
  ],
};

function Panel({
  set = views,
  unread = new Set<string>(['b']),
  onMarkAllRead = jest.fn(),
}: {
  set?: NotificationViewSet;
  unread?: ReadonlySet<string>;
  onMarkAllRead?: () => void;
}): JSX.Element {
  return (
    <I18nextProvider i18n={createContentI18n('uk', ['en'])}>
      <UINotificationHistory
        views={set}
        unread={unread}
        copy={copy}
        onMarkAllRead={onMarkAllRead}
      />
    </I18nextProvider>
  );
}

describe('UINotificationHistory', () => {
  it('shows the heading and the rows in the given order with message and time', () => {
    render(<Panel />);

    expect(screen.getByRole('heading', { level: 2, name: 'Сповіщення' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveAttribute('role', 'list');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Пароль змінено10 листопада, 09:15',
      'НепрочитанеНе вдалося зберегти10 листопада, 09:10',
      'Зміни збережено9 листопада, 18:00',
    ]);
  });

  it('shows a row without a time as its message alone', () => {
    render(<Panel set={{ items: [{ id: 'a', kind: 'success', message: 'Пароль змінено' }] }} />);

    expect(screen.getByRole('listitem')).toHaveTextContent(/^Пароль змінено$/u);
  });

  it('marks only the unread row with the hidden text', () => {
    render(<Panel />);
    const [first, second, third] = screen.getAllByRole('listitem');

    expect(within(second as HTMLElement).getByText('Непрочитане')).toBeInTheDocument();
    expect(within(first as HTMLElement).queryByText('Непрочитане')).not.toBeInTheDocument();
    expect(within(third as HTMLElement).queryByText('Непрочитане')).not.toBeInTheDocument();
    expect(screen.getAllByText('Непрочитане')).toHaveLength(1);
  });

  it('tints only the unread row', () => {
    render(<Panel />);
    const [first, second, third] = screen.getAllByRole('listitem');

    expect(second).toHaveStyle({ backgroundColor: '#FBFBFB' });
    expect(first).not.toHaveStyle({ backgroundColor: '#FBFBFB' });
    expect(third).not.toHaveStyle({ backgroundColor: '#FBFBFB' });
  });

  it('sets the unread title in Medium and the read titles in Regular', () => {
    render(<Panel />);

    expect(screen.getByText('Не вдалося зберегти')).toHaveStyle({ fontWeight: '500' });
    expect(screen.getByText('Пароль змінено')).toHaveStyle({ fontWeight: '400' });
  });

  it('marks several unread rows and none when all are read', () => {
    const { rerender } = render(<Panel unread={new Set(['a', 'c'])} />);

    expect(screen.getAllByText('Непрочитане')).toHaveLength(2);

    rerender(<Panel unread={new Set()} />);

    expect(screen.queryByText('Непрочитане')).not.toBeInTheDocument();
  });

  it('runs the mark-all handler once and stays enabled at zero unread', async () => {
    const onMarkAllRead = jest.fn();
    render(<Panel unread={new Set()} onMarkAllRead={onMarkAllRead} />);
    const button = screen.getByRole('button', { name: 'Позначити всі прочитаними' });

    await userEvent.click(button);

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    expect(button).toBeEnabled();
  });

  it('activates mark-all from the keyboard', async () => {
    const onMarkAllRead = jest.fn();
    render(<Panel onMarkAllRead={onMarkAllRead} />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state and no list items for an empty row set', () => {
    render(<Panel set={{ items: [] }} unread={new Set()} />);

    expect(screen.getByText('Сповіщень ще немає')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('Сповіщень ще немає')).toHaveStyle({ color: '#57595B' });
  });

  it('hides the empty state while rows exist', () => {
    render(<Panel />);

    expect(screen.queryByText('Сповіщень ще немає')).not.toBeInTheDocument();
  });

  it('carries no role but its list role, no live region and no close buttons', () => {
    render(<Panel />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/aria-live|aria-atomic|role=(?!"list")/);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
