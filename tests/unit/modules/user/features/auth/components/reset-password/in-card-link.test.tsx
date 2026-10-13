import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import InCardLink from '@auth/components/reset-password/in-card-link';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

function Arrival(): JSX.Element {
  const state = useLocation().state as RedirectNavigationState | null;
  return <p>{`arrived focusMain=${String(state?.focusMain)}`}</p>;
}

const renderLink = (): ReturnType<typeof render> => {
  const router = createMemoryRouter(
    [
      {
        path: '/password-recovery',
        element: (
          <main>
            <InCardLink to="/sign-in" variant="contained" sx={{}}>
              До входу
            </InCardLink>
          </main>
        ),
      },
      { path: '/sign-in', element: <Arrival /> },
    ],
    { initialEntries: ['/password-recovery'] }
  );
  return render(<RouterProvider router={router} />);
};

const clickAndReadPrevented = (link: HTMLElement, init: MouseEventInit = {}): boolean => {
  let prevented = false;
  const record = (event: Event): void => {
    prevented = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', record);
  fireEvent.click(link, init);
  window.removeEventListener('click', record);
  return prevented;
};

describe('InCardLink', () => {
  it('is a real anchor that keeps its href', () => {
    renderLink();

    expect(screen.getByRole('link', { name: 'До входу' })).toHaveAttribute('href', '/sign-in');
  });

  it('navigates in the router with the focus-on-arrival state on a plain click', async () => {
    renderLink();

    await userEvent.click(screen.getByRole('link', { name: 'До входу' }));

    expect(await screen.findByText('arrived focusMain=true')).toBeInTheDocument();
  });

  it('navigates in the router on Enter', async () => {
    renderLink();

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByText('arrived focusMain=true')).toBeInTheDocument();
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Meta', { metaKey: true }],
    ['Shift', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['the middle button', { button: 1 }],
  ])('leaves a click with %s to the browser', (_name, init) => {
    renderLink();
    const link = screen.getByRole('link', { name: 'До входу' });

    expect(clickAndReadPrevented(link, init)).toBe(false);
    expect(screen.queryByText(/arrived/)).not.toBeInTheDocument();
  });

  it('prevents the default of a plain primary click', () => {
    renderLink();

    expect(clickAndReadPrevented(screen.getByRole('link', { name: 'До входу' }))).toBe(true);
  });

  it('has no axe violations', async () => {
    const view = renderLink();

    await expectNoA11yViolations(view.container);
  });
});
