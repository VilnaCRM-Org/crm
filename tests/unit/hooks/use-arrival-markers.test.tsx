import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
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

type TestRouter = ReturnType<typeof createMemoryRouter>;
type To = number | string;

const arriveWith = (state: RedirectNavigationState): TestRouter => {
  const router = createMemoryRouter([{ path: '/sign-in', element: <Arrival /> }], {
    initialEntries: [{ pathname: '/sign-in', state }],
  });
  render(<RouterProvider router={router} />);
  return router;
};

describe('one-time arrival markers', () => {
  it('clears focusMain and the notice in one replace and keeps the captured notice', async () => {
    const router = arriveWith({ focusMain: true, notice: 'password_reset' });

    await waitFor(() => expect(router.state.location.state).toEqual({ focusMain: false }));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(screen.getByText('notice=password_reset')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('keeps the redirect origin while clearing the markers', async () => {
    const router = arriveWith({
      from: { pathname: '/deals' },
      focusMain: true,
      notice: 'password_reset',
    });

    await waitFor(() =>
      expect(router.state.location.state).toEqual({
        from: { pathname: '/deals' },
        focusMain: false,
      })
    );
    expect(screen.getByText('notice=password_reset')).toBeInTheDocument();
  });

  it.each<[string, readonly To[]]>([
    ['Back', [-1]],
    ['Back then Forward', [-1, 1]],
    ['a push to the same page', ['/sign-in']],
  ])('drops the notice for good after %s', async (_name, steps) => {
    const router = createMemoryRouter(
      [
        { path: '/sign-in', element: <Arrival /> },
        { path: '/password-reset', element: <p>reset</p> },
      ],
      { initialEntries: ['/sign-in', '/password-reset'], initialIndex: 1 }
    );
    render(<RouterProvider router={router} />);
    await act(() =>
      router.navigate('/sign-in', {
        replace: true,
        state: { focusMain: true, notice: 'password_reset' },
      })
    );
    expect(await screen.findByText('notice=password_reset')).toBeInTheDocument();

    for (const step of steps) {
      await act(() => (typeof step === 'number' ? router.navigate(step) : router.navigate(step)));
    }
    expect(await screen.findByText('notice=null')).toBeInTheDocument();

    await act(() => router.navigate('/sign-in', { replace: true }));
    expect(screen.getByText('notice=null')).toBeInTheDocument();
  });

  it('reports no notice for a plain arrival', async () => {
    arriveWith({});

    expect(await screen.findByText('notice=null')).toBeInTheDocument();
  });
});
