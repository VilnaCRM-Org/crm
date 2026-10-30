import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { type ReactElement, Suspense } from 'react';

import useAppShell from '@/components/layouts/use-app-shell';
import type { AppShellModuleLoader } from '@/components/types/layouts/app-layout-frame';
import type { ShellFailureHandler } from '@/routes/types/shell-slot';

function LoadedShell(): ReactElement {
  return <header>loaded shell</header>;
}

const loaderOf = (load: AppShellModuleLoader['load']): AppShellModuleLoader => ({ load });

describe('useAppShell', () => {
  it('creates the lazy shell once and keeps it across re-renders', () => {
    const load = jest.fn((): Promise<never> => new Promise(() => undefined));
    const shellLoader = loaderOf(load);

    const { result, rerender } = renderHook(() => useAppShell(shellLoader, undefined));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
    expect(load).not.toHaveBeenCalled();
  });

  it('renders the loaded shell module', async () => {
    const { result } = renderHook(() =>
      useAppShell(
        loaderOf(() => Promise.resolve({ default: LoadedShell })),
        undefined
      )
    );
    const AppShell = result.current;

    render(
      <Suspense fallback={<span>pending</span>}>
        <AppShell signOut={jest.fn()} />
      </Suspense>
    );

    expect(await screen.findByRole('banner')).toHaveTextContent('loaded shell');
  });

  it('reports a failure to the latest handler and resolves to the placeholders', async () => {
    const failure = new Error('Loading chunk ui-app-shell failed.');
    const stale = jest.fn();
    const latest = jest.fn();
    const { result, rerender } = renderHook(
      ({ handler }: { handler: ShellFailureHandler }) =>
        useAppShell(
          loaderOf(() => Promise.reject(failure)),
          handler
        ),
      { initialProps: { handler: stale } }
    );
    rerender({ handler: latest });
    const AppShell = result.current;

    render(
      <Suspense fallback={<span>pending</span>}>
        <AppShell signOut={jest.fn()} />
      </Suspense>
    );
    await waitFor(() => expect(latest).toHaveBeenCalledWith(failure));

    expect(stale).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('pending')).not.toBeInTheDocument());
    expect(
      screen
        .queryAllByRole('generic', { hidden: true })
        .filter((element) => element.getAttribute('aria-hidden') === 'true')
    ).toHaveLength(2);
  });
});
