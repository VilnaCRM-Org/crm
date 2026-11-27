import { act, render, screen } from '@testing-library/react';
import { type JSX, useEffect } from 'react';
import {
  createMemoryRouter,
  MemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router';

import useArrivalFocus from '@/hooks/use-arrival-focus';

type Entry = NonNullable<Parameters<typeof MemoryRouter>[0]['initialEntries']>;

let navigate: ReturnType<typeof useNavigate> | undefined;
let renders = 0;

function Landmark({ label }: { label: string }): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  renders += 1;

  return (
    <main ref={focusOnArrival} tabIndex={-1}>
      <p>{label}</p>
      <Outlet />
    </main>
  );
}

function HistoryProbe(): JSX.Element {
  const { pathname, search, state } = useLocation();
  const type = useNavigationType();
  navigate = useNavigate();

  return (
    <output aria-label="history">{`${type} ${pathname}${search} ${JSON.stringify(state)}`}</output>
  );
}

function tree(entries: Entry, label = 'layout'): JSX.Element {
  return (
    <MemoryRouter initialEntries={entries}>
      <HistoryProbe />
      <Routes>
        <Route element={<Landmark label={label} />}>
          <Route path="/" element={<p>landing page</p>} />
          <Route path="/deals" element={<p>deals page</p>} />
        </Route>
        <Route path="/public" element={<p>public page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderAt(entries: Entry): ReturnType<typeof render> {
  return render(tree(entries));
}

type TestRouter = ReturnType<typeof createMemoryRouter>;

function LeavingPage({ pending }: { pending: (() => void)[] }): JSX.Element {
  useEffect(() => pending.pop()?.(), [pending]);

  return <p>boards page</p>;
}

function routerWithLeavingPage(leave: (router: TestRouter) => void): TestRouter {
  const pending = [(): void => leave(router)];
  const router = createMemoryRouter([
    {
      element: <Landmark label="layout" />,
      children: [
        { path: '/', element: <p>landing page</p> },
        { path: '/boards', element: <LeavingPage pending={pending} /> },
        { path: '/deals', element: <p>deals page</p> },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  return router;
}

interface PendingTarget {
  readonly router: TestRouter;
  readonly settle: () => Promise<void>;
}

function routerWithPendingTarget(leave: (router: TestRouter) => Promise<void>): PendingTarget {
  let release = (): void => undefined;
  const loaded = new Promise<null>((resolve) => {
    release = (): void => resolve(null);
  });
  const leaving: Promise<void>[] = [];
  const pending = [
    (): void => {
      leaving.push(leave(router));
    },
  ];
  const router = createMemoryRouter(
    [
      {
        element: <Landmark label="layout" />,
        children: [
          {
            id: 'landing',
            path: '/',
            loader: (): Promise<null> => loaded,
            element: <p>landing page</p>,
          },
          { path: '/boards', element: <LeavingPage pending={pending} /> },
          { path: '/deals', loader: (): Promise<null> => loaded, element: <p>deals page</p> },
        ],
      },
    ],
    { hydrationData: { loaderData: { landing: null } } }
  );
  render(<RouterProvider router={router} />);

  return {
    router,
    settle: () =>
      act(async () => {
        release();
        await Promise.all(leaving);
      }),
  };
}

const history = (): HTMLElement => screen.getByRole('status', { name: 'history' });

describe('useArrivalFocus', () => {
  beforeEach(() => {
    navigate = undefined;
    renders = 0;
  });

  it('focuses the element once when the entry carries focusMain', () => {
    renderAt([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('never focuses an element a modal still hides, but still clears the marker', () => {
    render(
      <div aria-hidden="true">{tree([{ pathname: '/', state: { focusMain: true } }] as Entry)}</div>
    );

    expect(screen.getByRole('main', { hidden: true })).not.toHaveFocus();
    expect(screen.getByRole('status', { name: 'history', hidden: true })).toHaveTextContent(
      'REPLACE / {"focusMain":false}'
    );
  });

  it('clears the marker from the landing entry in place, keeping the rest of its state', () => {
    renderAt([
      {
        pathname: '/',
        search: '?tab=deals',
        state: { from: { pathname: '/deals' }, focusMain: true },
      },
    ] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(history()).toHaveTextContent(
      'REPLACE /?tab=deals {"from":{"pathname":"/deals"},"focusMain":false}'
    );
  });

  it('leaves focus and history alone without navigation state', () => {
    renderAt(['/']);

    expect(screen.getByRole('main')).not.toHaveFocus();
    expect(history()).toHaveTextContent('POP / null');
  });

  it('leaves focus and history alone when the state has no focus marker', () => {
    renderAt([{ pathname: '/', state: { from: { pathname: '/deals' } } }] as Entry);

    expect(screen.getByRole('main')).not.toHaveFocus();
    expect(history()).toHaveTextContent('POP / {"from":{"pathname":"/deals"}}');
  });

  it('leaves focus and history alone when focusMain is false', () => {
    renderAt([{ pathname: '/', state: { focusMain: false } }] as Entry);

    expect(screen.getByRole('main')).not.toHaveFocus();
    expect(history()).toHaveTextContent('POP / {"focusMain":false}');
  });

  it('does not re-focus the element when the component re-renders', () => {
    const view = renderAt([{ pathname: '/', state: { focusMain: true } }] as Entry);
    const main = screen.getByRole('main');

    act(() => main.blur());
    view.rerender(tree([{ pathname: '/', state: { focusMain: true } }] as Entry, 'layout again'));

    expect(renders).toBeGreaterThan(1);
    expect(screen.getByRole('main')).toBe(main);
    expect(main).toHaveTextContent('layout again');
    expect(main).not.toHaveFocus();
  });

  it('does not steal focus back when the landing entry is revisited', () => {
    renderAt([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();

    const main = screen.getByRole('main');

    act(() => navigate?.('/deals'));
    act(() => main.blur());

    expect(screen.getByText('deals page')).toBeInTheDocument();

    act(() => navigate?.(-1));

    expect(screen.getByText('landing page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBe(main);
    expect(main).not.toHaveFocus();
  });

  it('does not steal focus when Back remounts the layout on the landing entry', () => {
    renderAt([{ pathname: '/', state: { focusMain: true } }] as Entry);

    const first = screen.getByRole('main');

    expect(first).toHaveFocus();

    act(() => navigate?.('/public'));

    expect(screen.queryByRole('main')).not.toBeInTheDocument();

    act(() => navigate?.(-1));

    const remounted = screen.getByRole('main');

    expect(remounted).not.toBe(first);
    expect(screen.getByText('landing page')).toBeInTheDocument();
    expect(remounted).not.toHaveFocus();
  });

  it('focuses and clears a marker that arrives while the layout stays mounted', () => {
    renderAt(['/deals']);

    const main = screen.getByRole('main');

    expect(main).not.toHaveFocus();

    act(() => navigate?.('/', { state: { focusMain: true } }));

    expect(screen.getByText('landing page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBe(main);
    expect(main).toHaveFocus();
    expect(history()).toHaveTextContent('REPLACE / {"focusMain":false}');
  });

  it('keeps the entry Back returned to when Back lands before the marker is cleared', async () => {
    const router = routerWithLeavingPage((current) => {
      void current.navigate(-1);
    });
    const home = router.state.location;

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(router.state.location).toEqual(home);
    expect(router.state.historyAction).toBe('POP');
    expect(screen.getByText('landing page')).toBeInTheDocument();
  });

  it('keeps the entry a newer navigation pushed before the marker is cleared', async () => {
    const router = routerWithLeavingPage((current) => {
      void current.navigate('/deals', { state: { from: { pathname: '/' } } });
    });

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(router.state.location).toMatchObject({
      pathname: '/deals',
      state: { from: { pathname: '/' } },
    });
    expect(router.state.historyAction).toBe('PUSH');
    expect(screen.getByText('deals page')).toBeInTheDocument();
  });

  it('clears an abandoned marker on the next visit without moving focus', async () => {
    const router = routerWithLeavingPage((current) => {
      void current.navigate(-1);
    });
    await act(() => router.navigate('/boards', { state: { focusMain: true } }));
    const main = screen.getByRole('main');
    act(() => main.blur());

    await act(() => router.navigate(1));

    expect(router.state.location).toMatchObject({
      pathname: '/boards',
      state: { focusMain: false },
    });
    expect(main).not.toHaveFocus();

    await act(() => router.navigate(-1));
    await act(() => router.navigate(1));

    expect(router.state.location.pathname).toBe('/boards');
    expect(main).not.toHaveFocus();
  });

  it('returns to an entry a push abandoned without moving focus or losing Forward', async () => {
    const router = routerWithLeavingPage((current) => {
      void current.navigate('/deals');
    });
    await act(() => router.navigate('/boards', { state: { focusMain: true } }));
    const main = screen.getByRole('main');
    act(() => main.blur());

    await act(() => router.navigate(-1));

    expect(router.state.location).toMatchObject({
      pathname: '/boards',
      state: { focusMain: false },
    });
    expect(main).not.toHaveFocus();

    await act(() => router.navigate(1));

    expect(router.state.location.pathname).toBe('/deals');
  });

  it('focuses the newer arrival when it carries a marker as well', async () => {
    const router = routerWithLeavingPage((current) => {
      screen.getByRole('main').blur();
      void current.navigate('/deals', { state: { focusMain: true } });
    });

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(screen.getByText('deals page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(router.state.location).toMatchObject({
      pathname: '/deals',
      state: { focusMain: false },
    });
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('still clears the marker when Back and Forward return before it is cleared', async () => {
    const router = routerWithLeavingPage((current) => {
      void current.navigate(-1);
      void current.navigate(1);
    });

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(router.state.location).toMatchObject({
      pathname: '/boards',
      state: { focusMain: false },
    });
  });

  it('keeps the entry a pending Back is loading when the marker would be cleared', async () => {
    const { router, settle } = routerWithPendingTarget((current) => current.navigate(-1));
    const home = router.state.location;

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(router.state.navigation).toMatchObject({
      state: 'loading',
      location: { pathname: '/' },
    });

    await settle();

    expect(router.state.location).toEqual(home);
    expect(router.state.historyAction).toBe('POP');
    expect(screen.getByText('landing page')).toBeInTheDocument();
  });

  it('lets a pending push finish and clears its abandoned marker on the next visit', async () => {
    const { router, settle } = routerWithPendingTarget((current) => current.navigate('/deals'));

    await act(() => router.navigate('/boards', { state: { focusMain: true } }));

    expect(router.state.navigation).toMatchObject({
      state: 'loading',
      location: { pathname: '/deals' },
    });

    await settle();

    expect(router.state.location.pathname).toBe('/deals');
    expect(router.state.historyAction).toBe('PUSH');
    expect(screen.getByText('deals page')).toBeInTheDocument();

    const main = screen.getByRole('main');
    act(() => main.blur());

    await act(() => router.navigate(-1));

    expect(router.state.location).toMatchObject({
      pathname: '/boards',
      state: { focusMain: false },
    });
    expect(main).not.toHaveFocus();
  });
});
