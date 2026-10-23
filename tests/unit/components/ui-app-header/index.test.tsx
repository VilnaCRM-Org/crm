import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import { lazy } from 'react';

import UIAppHeader from '@/components/ui-app-header';
import renderShell from '@tests/unit/utils/render-shell';

const NeverResolves = lazy(() => new Promise<never>(() => undefined));

describe('UIAppHeader', () => {
  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'renders exactly one 64 px banner at %s',
    (layout) => {
      renderShell(<UIAppHeader layout={layout} />);

      const banners = screen.getAllByRole('banner');

      expect(banners).toHaveLength(1);
      expect(banners[0]).toHaveStyle({ height: '64px' });
    }
  );

  it('draws the 1 px #E1E7EA border on all four sides on desktop only', () => {
    const { rerender } = renderShell(<UIAppHeader layout="desktop" />);

    expect(screen.getByRole('banner')).toHaveStyle({ border: '1px solid #E1E7EA' });

    rerender(<UIAppHeader layout="tablet" />);
    expect(screen.getByRole('banner')).not.toHaveStyle({ border: '1px solid #E1E7EA' });

    rerender(<UIAppHeader layout="mobile" />);
    expect(screen.getByRole('banner')).not.toHaveStyle({ border: '1px solid #E1E7EA' });
  });

  it.each(['desktop', 'tablet'] as const)(
    'shows the disabled search, bell and list in this order at %s',
    (layout) => {
      renderShell(<UIAppHeader layout={layout} />);

      const controls = within(screen.getByRole('banner')).getAllByRole('button', {
        hidden: false,
      });
      const names = [
        screen.getByRole('searchbox', { name: 'Search' }),
        screen.getByRole('button', { name: 'Notifications' }),
        screen.getByRole('button', { name: 'Tasks' }),
      ];

      names.forEach((control) => expect(control).toBeDisabled());
      expect(controls).toHaveLength(2);
      expect(
        names[0]?.compareDocumentPosition(names[1] as HTMLElement) ===
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBe(true);
      expect(
        names[1]?.compareDocumentPosition(names[2] as HTMLElement) ===
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBe(true);
    }
  );

  it('puts no search in the DOM or accessibility tree on mobile', () => {
    renderShell(<UIAppHeader layout="mobile" />);

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Looking for something?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tasks' })).toBeDisabled();
  });

  it('shows the badges 1 and 8 with their descriptions when counts are passed', () => {
    renderShell(<UIAppHeader layout="desktop" badgeCounts={{ notifications: 1, tasks: 8 }} />);

    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAccessibleDescription(
      'Not available yet 1 notification'
    );
    expect(screen.getByRole('button', { name: 'Tasks' })).toHaveAccessibleDescription(
      'Not available yet 8 tasks'
    );
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Tasks' })).toHaveTextContent('8');
  });

  it.each([undefined, null, {}, { notifications: null, tasks: null }])(
    'shows no badge, digit or count text for the counts %j',
    (badgeCounts) => {
      const { container } = renderShell(<UIAppHeader layout="tablet" badgeCounts={badgeCounts} />);

      expect(container).not.toHaveTextContent(/\d/u);
    }
  );

  it('shows no badge on mobile even when counts are passed', () => {
    const { container } = renderShell(
      <UIAppHeader layout="mobile" badgeCounts={{ notifications: 1, tasks: 8 }} />
    );

    expect(container).not.toHaveTextContent(/\d/u);
  });

  it('holds the logo link before the controls and an empty aria-hidden slot placeholder', () => {
    renderShell(<UIAppHeader layout="desktop" userMenu={<NeverResolves />} />);

    const logo = screen.getByRole('link', { name: 'VilnaCRM' });
    const search = screen.getByRole('searchbox', { name: 'Search' });
    const placeholders = screen
      .getAllByRole('generic', { hidden: true })
      .filter((box) => box.getAttribute('aria-hidden') === 'true');

    expect(logo.compareDocumentPosition(search)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(placeholders).toHaveLength(1);
    expect(placeholders[0]).toBeEmptyDOMElement();
  });

  it('renders the resolved user menu inside the slot', () => {
    renderShell(
      <UIAppHeader layout="tablet" userMenu={<button type="button">Евгения Маслова</button>} />
    );

    expect(screen.getByRole('button', { name: 'Евгения Маслова' })).toBeInTheDocument();
  });

  it('renders no MUI ripple anywhere in the header', () => {
    const { container } = renderShell(<UIAppHeader layout="desktop" />);

    expect(container).not.toContainHTML('MuiTouchRipple');
  });

  it('reads in uk', () => {
    renderShell(<UIAppHeader layout="desktop" />, { locale: 'uk' });

    expect(screen.getByRole('searchbox', { name: 'Пошук' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Сповіщення' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Завдання' })).toBeDisabled();
  });
});
