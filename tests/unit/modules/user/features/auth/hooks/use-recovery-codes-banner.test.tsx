import '@testing-library/jest-dom';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useNavigate } from 'react-router';

import useRecoveryCodesBanner from '@auth/hooks/use-recovery-codes-banner';
import useAuthStore from '@auth/stores/use-auth-store';
import testI18n from '@tests/i18n/test-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

let navigate: ReturnType<typeof useNavigate> | undefined;

const mockLoad = jest.fn();

jest.mock('@auth/components/recovery-codes-notice', () => ({
  __esModule: true,
  default: ({ count, onDismiss }: { count: number; onDismiss: () => void }): JSX.Element => (
    <button type="button" onClick={onDismiss}>
      notice:{count}
    </button>
  ),
}));

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockLoad() },
}));

function ShellStub({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div role="group" aria-label="theme shell">
      {children}
    </div>
  );
}

function Probe(): JSX.Element {
  navigate = useNavigate();
  return <section aria-label="banner">{useRecoveryCodesBanner()}</section>;
}

const mount = (remaining: number | null, path = '/'): ReturnType<typeof render> => {
  act(() => {
    resetClientStores();
    useAuthStore.setState({ recoveryCodesRemaining: remaining });
  });
  return render(
    <I18nextProvider i18n={testI18n}>
      <MemoryRouter initialEntries={[path]}>
        <Probe />
      </MemoryRouter>
    </I18nextProvider>
  );
};

describe('useRecoveryCodesBanner', () => {
  beforeEach(() => {
    mockLoad.mockReset();
    mockLoad.mockResolvedValue({ default: ShellStub });
  });

  afterEach(() => jest.useRealTimers());

  it('renders nothing and never requests the notice chunk without a reported count', () => {
    mount(null);

    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2])('renders the notice for %i remaining code(s)', async (count) => {
    mount(count);

    expect(await screen.findByRole('button', { name: `notice:${count}` })).toBeInTheDocument();
  });

  it('renders the notice inside the MUI theme shell and forwards its dismiss handler', async () => {
    mount(2);

    const notice = await screen.findByRole('button', { name: 'notice:2' });
    expect(screen.getByRole('group', { name: 'theme shell' })).toContainElement(notice);

    await userEvent.click(notice);

    expect(useAuthStore.getState().recoveryCodesRemaining).toBeNull();
  });

  it('holds the route fallback status region while the notice chunk is loading', () => {
    mockLoad.mockReturnValue(new Promise(() => undefined));

    mount(1);

    const banner = screen.getByRole('region', { name: 'banner' });
    expect(within(banner).getByRole('status')).toBeInTheDocument();
  });

  it('reserves only the notice height, never the half-screen route loader, while loading', () => {
    jest.useFakeTimers();
    mockLoad.mockReturnValue(new Promise(() => undefined));
    mount(1);

    act(() => {
      jest.advanceTimersByTime(150);
    });

    const banner = screen.getByRole('region', { name: 'banner' });
    const heights = within(banner)
      .getAllByRole('generic')
      .map((element) => window.getComputedStyle(element).minHeight);
    expect(heights).toContain('5.125rem');
    expect(heights).not.toContain('50vh');
  });

  it('clears the count when the notice is dismissed', async () => {
    mount(1);

    await userEvent.click(await screen.findByRole('button', { name: 'notice:1' }));

    expect(useAuthStore.getState().recoveryCodesRemaining).toBeNull();
    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
  });

  it('shows no notice on /settings and clears the count there', () => {
    mount(1, '/settings');

    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
    expect(useAuthStore.getState().recoveryCodesRemaining).toBeNull();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it('writes nothing to the store on /settings when there is no count to clear', async () => {
    mount(null, '/settings');
    const setState = jest.spyOn(useAuthStore, 'setState');

    await act(async () => navigate?.('/settings?tab=security'));

    expect(setState).not.toHaveBeenCalled();
    setState.mockRestore();
  });

  it('clears the count when the user arrives on /settings after mount', async () => {
    mount(2);
    await screen.findByRole('button', { name: 'notice:2' });

    await act(async () => navigate?.('/settings'));

    expect(useAuthStore.getState().recoveryCodesRemaining).toBeNull();
    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
  });

  it('keeps the count on other paths', async () => {
    mount(1);
    await screen.findByRole('button', { name: 'notice:1' });

    await act(async () => navigate?.('/boards'));

    expect(useAuthStore.getState().recoveryCodesRemaining).toBe(1);
    expect(screen.getByRole('button', { name: 'notice:1' })).toBeInTheDocument();
  });

  it('creates the lazy notice once per mount, however often the count changes', async () => {
    mount(2);
    await screen.findByRole('button', { name: 'notice:2' });

    await act(async () => useAuthStore.setState({ recoveryCodesRemaining: 1 }));

    expect(await screen.findByRole('button', { name: 'notice:1' })).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('shows nothing, and does not break the page, when the chunk cannot be loaded', async () => {
    mockLoad.mockRejectedValue(new Error('chunk failed'));
    mount(1);

    const banner = screen.getByRole('region', { name: 'banner' });
    await waitFor(() => expect(banner).toBeEmptyDOMElement());
    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('asks the loader again on the next mount after a failed load', async () => {
    mockLoad.mockRejectedValueOnce(new Error('chunk failed'));
    const { unmount } = mount(1);
    const banner = screen.getByRole('region', { name: 'banner' });
    await waitFor(() => expect(banner).toBeEmptyDOMElement());
    unmount();

    mount(1);

    expect(await screen.findByRole('button', { name: 'notice:1' })).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledTimes(2);
  });
});
