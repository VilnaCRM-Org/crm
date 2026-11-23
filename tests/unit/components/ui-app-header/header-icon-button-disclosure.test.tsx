import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import type { HeaderDisclosure } from '@/components/types/ui-app-header';
import HeaderIconButton from '@/components/ui-app-header/header-icon-button';
import renderShell from '@tests/unit/utils/render-shell';

const disclosure = (overrides: Partial<HeaderDisclosure> = {}): HeaderDisclosure => ({
  expanded: false,
  controls: 'notification-history',
  describedBy: '4 unread notifications',
  onToggle: jest.fn(),
  ...overrides,
});

const bell = (): HTMLElement => screen.getByRole('button', { name: 'Notifications' });

describe('HeaderIconButton with a disclosure', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'is an enabled, collapsed button controlling the panel at %s',
    (layout) => {
      renderShell(
        <HeaderIconButton layout={layout} kind="notifications" disclosure={disclosure()} />
      );

      expect(bell()).toBeEnabled();
      expect(bell()).toHaveAttribute('aria-expanded', 'false');
      expect(bell()).toHaveAttribute('aria-controls', 'notification-history');
      expect(bell()).toHaveAccessibleDescription('4 unread notifications');
    }
  );

  it('reports the expanded state', () => {
    renderShell(
      <HeaderIconButton
        layout="desktop"
        kind="notifications"
        disclosure={disclosure({ expanded: true })}
      />
    );

    expect(bell()).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no description when describedBy is absent', () => {
    renderShell(
      <HeaderIconButton
        layout="desktop"
        kind="notifications"
        disclosure={disclosure({ describedBy: undefined })}
      />
    );

    expect(bell()).not.toHaveAttribute('aria-describedby');
    expect(bell()).toHaveAccessibleDescription('');
  });

  it.each(['desktop', 'tablet'] as const)(
    'draws one alert badge and one description at %s, never the unavailable text',
    (layout) => {
      const { container } = renderShell(
        <HeaderIconButton
          layout={layout}
          kind="notifications"
          count={4}
          disclosure={disclosure()}
        />
      );

      expect(bell()).toHaveTextContent(/^$/u);
      expect(screen.getByText('4')).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getAllByText('4')).toHaveLength(1);
      expect(screen.getByText('4')).toHaveStyle({ backgroundColor: '#D63333' });
      expect(bell()).toHaveAccessibleDescription('4 unread notifications');
      expect(container).not.toHaveTextContent('Not available yet');
      expect(container).not.toHaveTextContent('4 notifications');
      expect(container).toHaveTextContent('4 unread notifications');
    }
  );

  it('draws no badge on mobile and keeps the single description', () => {
    renderShell(
      <HeaderIconButton layout="mobile" kind="notifications" count={4} disclosure={disclosure()} />
    );

    expect(bell()).toHaveTextContent(/^$/u);
    expect(bell()).toHaveAccessibleDescription('4 unread notifications');
  });

  it('draws no badge for a count that is not a whole number of at least 1', () => {
    renderShell(
      <HeaderIconButton layout="desktop" kind="notifications" count={0} disclosure={disclosure()} />
    );

    expect(bell()).toHaveTextContent(/^$/u);
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('runs onToggle once on %s', async (_name, keys) => {
    const onToggle = jest.fn();
    renderShell(
      <HeaderIconButton
        layout="desktop"
        kind="notifications"
        disclosure={disclosure({ onToggle })}
      />
    );

    await userEvent.tab();
    expect(bell()).toHaveFocus();
    await userEvent.keyboard(keys);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('runs onToggle once on a click', async () => {
    const onToggle = jest.fn();
    renderShell(
      <HeaderIconButton
        layout="tablet"
        kind="notifications"
        disclosure={disclosure({ onToggle })}
      />
    );

    await userEvent.click(bell());

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps the name in uk and speaks the description it was given', () => {
    renderShell(
      <HeaderIconButton
        layout="desktop"
        kind="notifications"
        disclosure={disclosure({ describedBy: '4 непрочитані' })}
      />,
      { locale: 'uk' }
    );

    expect(screen.getByRole('button', { name: 'Сповіщення' })).toHaveAccessibleDescription(
      '4 непрочитані'
    );
  });

  it('attaches the button ref of the disclosure to the enabled bell', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    renderShell(
      <HeaderIconButton
        layout="desktop"
        kind="notifications"
        disclosure={disclosure({ buttonRef })}
      />
    );

    expect(buttonRef.current).toBe(bell());
  });

  it('leaves the control without a disclosure disabled and described as unavailable', () => {
    renderShell(<HeaderIconButton layout="desktop" kind="notifications" />);

    expect(bell()).toBeDisabled();
    expect(bell()).not.toHaveAttribute('aria-expanded');
    expect(bell()).not.toHaveAttribute('aria-controls');
    expect(bell()).toHaveAccessibleDescription('Not available yet');
  });
});
