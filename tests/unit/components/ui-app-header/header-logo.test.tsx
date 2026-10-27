import '@testing-library/jest-dom';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router';

import HeaderLogo from '@/components/ui-app-header/header-logo';
import useArrivalFocus from '@/hooks/use-arrival-focus';
import renderShell from '@tests/unit/utils/render-shell';

function Probe(): JSX.Element {
  const location = useLocation();
  const focusOnArrival = useArrivalFocus();
  const renders = useRef(0);
  renders.current += 1;

  return (
    <>
      <HeaderLogo layout="desktop" />
      <main ref={focusOnArrival} tabIndex={-1}>
        <span data-location={location.pathname}>{location.pathname}</span>
      </main>
    </>
  );
}

const renderOn = (path: string): void => {
  renderShell(
    <Routes>
      <Route path="*" element={<Probe />} />
    </Routes>,
    { path }
  );
};

describe('HeaderLogo', () => {
  it.each([
    ['desktop', '143px', '48.125px', 'shell-logo-desktop.svg'],
    ['tablet', '143px', '48.125px', 'shell-logo-desktop.svg'],
    ['mobile', '125px', '42.067px', 'shell-logo-mobile.svg'],
  ] as const)('draws the %s artwork at its Figma box', (layout, width, height, artwork) => {
    renderShell(<HeaderLogo layout={layout} />);

    const image = screen.getByRole('presentation');

    expect(image).toHaveAttribute('src', artwork);
    expect(image).toHaveStyle({ width, height });
  });

  it('is one link to / named VilnaCRM whose image has no name of its own', () => {
    renderShell(<HeaderLogo layout="desktop" />);

    const link = screen.getByRole('link', { name: 'VilnaCRM' });

    expect(link).toHaveAttribute('href', '/');
    expect(link).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('presentation')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('is 44 px tall at mobile for the touch target', () => {
    renderShell(<HeaderLogo layout="mobile" />);

    expect(screen.getByRole('link', { name: 'VilnaCRM' })).toHaveStyle({ height: '44px' });
  });

  it('navigates to / from /settings without a document load and focuses main', async () => {
    const user = userEvent.setup();
    renderOn('/settings');

    await user.click(screen.getByRole('link', { name: 'VilnaCRM' }));

    expect(screen.getByRole('main')).toHaveTextContent('/');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('navigates with Enter as well', async () => {
    const user = userEvent.setup();
    renderOn('/settings');
    act(() => screen.getByRole('link', { name: 'VilnaCRM' }).focus());

    await user.keyboard('{Enter}');

    expect(screen.getByRole('main')).toHaveTextContent('/');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps the history length when already on / and still focuses main', async () => {
    const user = userEvent.setup();
    const before = window.history.length;
    renderOn('/');

    await user.click(screen.getByRole('link', { name: 'VilnaCRM' }));

    expect(window.history.length).toBe(before);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('renders no MUI ripple inside the link', () => {
    const { container } = renderShell(<HeaderLogo layout="desktop" />);

    expect(container).not.toContainHTML('MuiTouchRipple');
  });
});
