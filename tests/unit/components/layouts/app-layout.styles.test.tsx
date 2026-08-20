import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

jest.mock('react-router-dom', () => ({
  Outlet: (): ReactElement => <span>route-outlet</span>,
}));

const AppLayout = jest.requireActual<typeof import('@/components/layouts/app-layout')>(
  '@/components/layouts/app-layout'
).default;

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
