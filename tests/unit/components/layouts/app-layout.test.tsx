import { act, render, type RenderResult, screen } from '@testing-library/react';
import type { JSX, ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes, useNavigate, useOutletContext } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
import type { UserMenuSlot } from '@/routes/types/shell-slot';
import testI18n from '@tests/i18n/test-i18n';

let mockFooterPending = false;
const mockNeverSettles = new Promise<never>(() => undefined);

jest.mock('@/components/ui-footer', () => ({
  __esModule: true,
  default: (): ReactElement => {
    if (mockFooterPending) throw mockNeverSettles;
    return <footer>shell footer</footer>;
  },
}));

let mockShellPending = false;

jest.mock('@/components/layouts/app-shell-loader', () => ({
  __esModule: true,
  default: {
    load: (): Promise<unknown> =>
      Promise.resolve({
        default: ({ signOut, userMenu: UserMenu }: UIAppShellProps): ReactElement => {
          if (mockShellPending) throw mockNeverSettles;
          return (
            <>
              <header>
                <button type="button" onClick={signOut}>
                  shell sign out
                </button>
                {UserMenu === undefined ? null : <UserMenu signOut={signOut} />}
              </header>
              <nav aria-label="Main navigation">shell navigation</nav>
            </>
          );
        },
      }),
  },
}));

type Entry = NonNullable<Parameters<typeof MemoryRouter>[0]['initialEntries']>;

let navigate: ReturnType<typeof useNavigate> | undefined;

function NavigationProbe(): JSX.Element {
  navigate = useNavigate();

  return <span>probe</span>;
}

function SignOutProbe(): JSX.Element {
  const { signOut } = useOutletContext<ProtectedOutletContext>();

  return (
    <button type="button" onClick={signOut}>
      sign out
    </button>
  );
}

async function renderLayout(
  entries: Entry,
  page: JSX.Element = <div>home page</div>,
  signOut: () => void = jest.fn(),
  userMenu?: UserMenuSlot
): Promise<RenderResult> {
  const view = render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={entries}>
        <Routes>
          <Route element={<Outlet context={{ signOut }} />}>
            <Route element={<AppLayout userMenu={userMenu} />}>
              <Route path="/" element={page} />
              <Route path="/deals" element={<div>deals page</div>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

  await screen.findByRole('contentinfo');
  await screen.findByRole('banner');

  return view;
}

describe('AppLayout', () => {
  it('renders the routed content inside a main landmark', async () => {
    await renderLayout(['/']);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(screen.getByText('home page'));
  });

  it('lazily renders the shell footer as a sibling after main, never inside it', async () => {
    await renderLayout(['/']);

    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(footer).toHaveTextContent('shell footer');
    expect(main).not.toContainElement(footer);
    expect(footer).not.toContainElement(main);
    expect(main.compareDocumentPosition(footer)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('holds the footer slot with an empty, hidden placeholder while the chunk loads', async () => {
    jest.useFakeTimers();
    mockFooterPending = true;

    try {
      render(
        <I18nextProvider i18n={testI18n}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<div>home page</div>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      );

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      const placeholders = screen
        .queryAllByRole('generic', { hidden: true })
        .filter((element) => window.getComputedStyle(element).minHeight === '4.125rem');

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.queryByText(testI18n.t('route_fallback.loading'))).not.toBeInTheDocument();
      expect(placeholders).toHaveLength(1);
      expect(placeholders[0]).toHaveAttribute('aria-hidden', 'true');
      expect(placeholders[0]).toBeEmptyDOMElement();
      expect(screen.getByRole('main').compareDocumentPosition(placeholders[0] as Node)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING
      );
      expect(screen.getByRole('main')).toHaveTextContent('home page');
    } finally {
      mockFooterPending = false;
      jest.useRealTimers();
    }
  });

  it('forwards the protected outlet context to the routed page', async () => {
    const signOut = jest.fn();
    await renderLayout(['/'], <SignOutProbe />, signOut);

    act(() => screen.getByRole('button', { name: 'sign out' }).click());

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the main landmark after a post-login redirect', async () => {
    await renderLayout([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('reserves the sticky header height as top scroll padding until it unmounts', async () => {
    const view = await renderLayout(['/']);
    const root = document.documentElement;

    expect(root.style.getPropertyValue('scroll-padding-top')).toBe('64px');

    view.unmount();

    expect(root.style.getPropertyValue('scroll-padding-top')).toBe('');
  });

  it('keeps the main landmark programmatically focusable but outside the tab order', async () => {
    await renderLayout(['/']);

    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('does not steal focus on ordinary navigation', async () => {
    await renderLayout(['/']);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('does not steal focus when navigation state exists without the focus marker', async () => {
    await renderLayout([{ pathname: '/', state: { from: { pathname: '/deals' } } }] as Entry);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('does not steal focus back when the landing entry is revisited', async () => {
    await renderLayout(
      [{ pathname: '/', state: { focusMain: true } }] as Entry,
      <NavigationProbe />
    );

    const main = screen.getByRole('main');

    expect(main).toHaveFocus();

    act(() => navigate?.('/deals'));
    act(() => main.blur());

    expect(main).not.toHaveFocus();

    act(() => navigate?.(-1));

    expect(screen.getByText('probe')).toBeInTheDocument();
    expect(main).not.toHaveFocus();
  });

  it('orders the landmarks banner, navigation, main and contentinfo, one of each', async () => {
    await renderLayout(['/']);

    const landmarks = [
      screen.getByRole('banner'),
      screen.getByRole('navigation', { name: 'Main navigation' }),
      screen.getByRole('main'),
      screen.getByRole('contentinfo'),
    ];

    const followed = landmarks
      .slice(1)
      .map((next, index) => (landmarks[index] as HTMLElement).compareDocumentPosition(next));

    expect(followed).toEqual(landmarks.slice(1).map(() => Node.DOCUMENT_POSITION_FOLLOWING));
    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('hands the shell the outlet sign out and the user menu slot', async () => {
    const signOut = jest.fn();
    const userMenu: UserMenuSlot = ({ signOut: menuSignOut }) => (
      <button type="button" onClick={menuSignOut}>
        slot sign out
      </button>
    );
    await renderLayout(['/'], undefined, signOut, userMenu);

    act(() => screen.getByRole('button', { name: 'shell sign out' }).click());
    act(() => screen.getByRole('button', { name: 'slot sign out' }).click());

    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('focuses main, not the header or the navigation, on arrival', async () => {
    await renderLayout([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'shell sign out' })).not.toHaveFocus();
  });

  it('keeps the shell out of the routed page and the footer out of the shell', async () => {
    await renderLayout(['/']);

    expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('banner'));
    expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('navigation'));
    expect(screen.getByRole('contentinfo')).not.toContainElement(screen.getByRole('banner'));
  });

  it('reserves the header and navigation column with two empty hidden placeholders', async () => {
    jest.useFakeTimers();
    mockShellPending = true;

    try {
      render(
        <I18nextProvider i18n={testI18n}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={{ signOut: jest.fn() }} />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<div>home page</div>} />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      );

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      const placeholders = screen
        .queryAllByRole('generic', { hidden: true })
        .filter((element) => element.getAttribute('aria-hidden') === 'true')
        .filter((element) => window.getComputedStyle(element).minHeight !== '4.125rem');

      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
      expect(placeholders).toHaveLength(2);
      for (const placeholder of placeholders) expect(placeholder).toBeEmptyDOMElement();
      expect(placeholders[0]).toHaveStyle({ height: '64px', position: 'sticky' });
      expect(placeholders[1]).toHaveStyle({ width: '250px' });
      expect(screen.getByRole('main').compareDocumentPosition(placeholders[0] as Node)).toBe(
        Node.DOCUMENT_POSITION_PRECEDING
      );
      expect(screen.getByRole('main')).toHaveTextContent('home page');
    } finally {
      mockShellPending = false;
      jest.useRealTimers();
    }
  });
});
