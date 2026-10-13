import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

import useArrivalFocus from '@/hooks/use-arrival-focus';
import useArrivalNotice from '@/hooks/use-arrival-notice';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

function Arrival(): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  const notice = useArrivalNotice();
  const state = useLocation().state as RedirectNavigationState | null;

  return (
    <main ref={focusOnArrival} tabIndex={-1}>
      <p>{`notice=${String(notice)}`}</p>
      <output aria-label="state">{JSON.stringify(state)}</output>
    </main>
  );
}

const arriveWith = (state: RedirectNavigationState): ReturnType<typeof createMemoryRouter> => {
  const router = createMemoryRouter([{ path: '/sign-in', element: <Arrival /> }], {
    initialEntries: [{ pathname: '/sign-in', state }],
  });
  render(<RouterProvider router={router} />);
  return router;
};

describe('one-time arrival markers', () => {
  it('clears focusMain and the notice in one replace and keeps the captured notice', async () => {
    const router = arriveWith({ focusMain: true, notice: 'password_reset' });

    expect(await screen.findByText('notice=password_reset')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(router.state.historyAction).toBe('REPLACE');
    expect(router.state.location.state).toEqual({ focusMain: false });
  });

  it('keeps the redirect origin while clearing the markers', async () => {
    const router = arriveWith({
      from: { pathname: '/deals' },
      focusMain: true,
      notice: 'password_reset',
    });

    await screen.findByText('notice=password_reset');
    expect(router.state.location.state).toEqual({ from: { pathname: '/deals' }, focusMain: false });
  });

  it('reports no notice for a plain arrival', async () => {
    arriveWith({});

    expect(await screen.findByText('notice=null')).toBeInTheDocument();
  });
});
