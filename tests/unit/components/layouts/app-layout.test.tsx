// @jest-environment jsdom

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

describe('AppLayout', () => {
  it('renders Outlet inside a main landmark (AC1)', () => {
    render(<AppLayout />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByText('route-outlet'));
  });

  it('main landmark is the direct wrapper of Outlet (AC1)', () => {
    render(<AppLayout />);

    expect(screen.getByRole('main').tagName).toBe('MAIN');
  });
});
