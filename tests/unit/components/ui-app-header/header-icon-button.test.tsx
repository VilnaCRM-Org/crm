import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderIconButton from '@/components/ui-app-header/header-icon-button';
import renderShell from '@tests/unit/utils/render-shell';

describe('HeaderIconButton', () => {
  it.each([
    ['notifications', 'Notifications'],
    ['tasks', 'Tasks'],
  ] as const)(
    'renders the %s control disabled, named and described by the status',
    (kind, name) => {
      renderShell(<HeaderIconButton layout="desktop" kind={kind} />);

      const button = screen.getByRole('button', { name });

      expect(button).toBeDisabled();
      expect(button).toHaveAccessibleDescription('Not available yet');
      expect(button).toContainHTML('aria-hidden="true"');
    }
  );

  it.each([
    ['notifications', 'Сповіщення', 'Ще недоступно'],
    ['tasks', 'Завдання', 'Ще недоступно'],
  ] as const)('speaks the %s control in uk', (kind, name, status) => {
    renderShell(<HeaderIconButton layout="tablet" kind={kind} />, { locale: 'uk' });

    expect(screen.getByRole('button', { name })).toHaveAccessibleDescription(status);
  });

  it('does nothing when clicked and takes no focus on Tab', async () => {
    const user = userEvent.setup();
    renderShell(<HeaderIconButton layout="desktop" kind="notifications" />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.tab();

    expect(screen.getByRole('button', { name: 'Notifications' })).not.toHaveFocus();
    expect(document.body).toHaveFocus();
  });

  it('shows no badge, digit or count text without a count', () => {
    const { container } = renderShell(<HeaderIconButton layout="desktop" kind="tasks" />);

    expect(screen.getByRole('button', { name: 'Tasks' })).toHaveAccessibleDescription(
      'Not available yet'
    );
    expect(container).not.toHaveTextContent(/\d/u);
  });

  it.each([null, 0, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'shows no badge and no count text for %s',
    (count) => {
      const { container } = renderShell(
        <HeaderIconButton layout="tablet" kind="notifications" count={count} />
      );

      const button = screen.getByRole('button', { name: 'Notifications' });

      expect(button).toHaveTextContent(/^$/u);
      expect(button).toHaveAccessibleDescription('Not available yet');
      expect(container).toHaveTextContent(/^Not available yet$/u);
    }
  );

  it.each([
    ['notifications', 1, 'Notifications', '1 notification'],
    ['notifications', 2, 'Notifications', '2 notifications'],
    ['tasks', 8, 'Tasks', '8 tasks'],
    ['tasks', 21, 'Tasks', '21 tasks'],
  ] as const)(
    'renders the %s badge %i and adds its count to the description in en',
    (kind, count, name, text) => {
      renderShell(<HeaderIconButton layout="desktop" kind={kind} count={count} />);

      const button = screen.getByRole('button', { name });

      expect(button).toHaveAccessibleDescription(`Not available yet ${text}`);
      expect(button).toHaveTextContent(String(count));
    }
  );

  it('shows 99+ on the badge over 99 and keeps the real count in the description', () => {
    renderShell(<HeaderIconButton layout="desktop" kind="notifications" count={150} />);

    const button = screen.getByRole('button', { name: 'Notifications' });

    expect(button).toHaveTextContent(/^99\+$/u);
    expect(button).toHaveAccessibleDescription('Not available yet 150 notifications');
  });

  it.each([
    ['notifications', 1, 'Сповіщення', '1 сповіщення'],
    ['notifications', 2, 'Сповіщення', '2 сповіщення'],
    ['notifications', 5, 'Сповіщення', '5 сповіщень'],
    ['tasks', 8, 'Завдання', '8 завдань'],
    ['tasks', 21, 'Завдання', '21 завдання'],
  ] as const)('uses the CLDR plural form of %s %i in uk', (kind, count, name, text) => {
    renderShell(<HeaderIconButton layout="tablet" kind={kind} count={count} />, { locale: 'uk' });

    expect(screen.getByRole('button', { name })).toHaveAccessibleDescription(
      `Ще недоступно ${text}`
    );
  });

  it('draws the mobile control as the bare glyph with no badge or count for any count', () => {
    renderShell(<HeaderIconButton layout="mobile" kind="notifications" count={8} />);

    const button = screen.getByRole('button', { name: 'Notifications' });

    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Not available yet');
    expect(button).toHaveTextContent(/^$/u);
    expect(button).toHaveStyle({ width: '24px', height: '24px' });
    expect(screen.queryByText(/8/u)).not.toBeInTheDocument();
  });

  it('renders no MUI ripple inside the control', () => {
    const { container } = renderShell(<HeaderIconButton layout="desktop" kind="tasks" />);

    expect(container).not.toContainHTML('MuiTouchRipple');
  });
});
