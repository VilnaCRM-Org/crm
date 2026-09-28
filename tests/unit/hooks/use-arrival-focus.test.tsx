import { act, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import {
  MemoryRouter,
  Outlet,
  Route,
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
});
