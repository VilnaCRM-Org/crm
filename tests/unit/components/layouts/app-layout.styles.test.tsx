import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

jest.mock('react-router-dom', () => ({
  Outlet: (): ReactElement => <span>route-outlet</span>,
  useLocation: (): { state: null } => ({ state: null }),
}));

const AppLayout = jest.requireActual<typeof import('@/components/layouts/app-layout')>(
  '@/components/layouts/app-layout'
).default;

function emittedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((element) => element.textContent ?? '')
    .join('');
}

describe('AppLayout stretching', () => {
  it('lets the main landmark grow as a full-height flex column', () => {
    render(<AppLayout />);

    expect(screen.getByRole('main')).toHaveStyle({
      flexGrow: '1',
      display: 'flex',
      flexDirection: 'column',
    });
  });
});

describe('AppLayout focus ring', () => {
  it('never suppresses the outline unconditionally', () => {
    render(<AppLayout />);

    expect(screen.getByRole('main').getAttribute('style') ?? '').not.toContain('outline');
    expect(screen.getByRole('main')).not.toHaveStyle({ outline: 'none' });
  });

  it('suppresses the ring only for the programmatic :focus-not-:focus-visible case', () => {
    render(<AppLayout />);

    expect(emittedCss()).toContain(':focus:not(:focus-visible)');
  });
});
