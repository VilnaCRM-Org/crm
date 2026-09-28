import { act, render, screen } from '@testing-library/react';
import type { JSX, ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Outlet, Route, Routes, useNavigate, useOutletContext } from 'react-router';

import AppLayout from '@/components/layouts/app-layout';
import type { ProtectedOutletContext } from '@/routes/types/protected-outlet-context';
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
  signOut: () => void = jest.fn()
): Promise<void> {
  render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={entries}>
        <Routes>
          <Route element={<Outlet context={{ signOut }} />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={page} />
              <Route path="/deals" element={<div>deals page</div>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  );

  await screen.findByRole('contentinfo');
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
              <Route element={<AppLayout />}>
                <Route path="/" element={<div>home page</div>} />
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
});
