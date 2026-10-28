import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useNavigate } from 'react-router';

import useRecoveryCodesBanner from '@auth/hooks/use-recovery-codes-banner';
import useAuthStore from '@auth/stores/use-auth-store';
import testI18n from '@tests/i18n/test-i18n';
import { resetClientStores } from '@tests/utils/reset-client-stores';

let navigate: ReturnType<typeof useNavigate> | undefined;

const mockLoad = jest.fn();

jest.mock('@auth/components/protected-route/recovery-notice-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockLoad() },
}));

function NoticeStub({ count, onDismiss }: { count: number; onDismiss: () => void }): JSX.Element {
  return (
    <button type="button" onClick={onDismiss}>
      notice:{count}
    </button>
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
    mockLoad.mockResolvedValue({ default: NoticeStub });
  });

  it('renders nothing and never requests the notice chunk without a reported count', () => {
    mount(null);

    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
    expect(mockLoad).not.toHaveBeenCalled();
  });

  it.each([0, 1, 2])('renders the notice for %i remaining code(s)', async (count) => {
    mount(count);

    expect(await screen.findByRole('button', { name: `notice:${count}` })).toBeInTheDocument();
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

    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('region', { name: 'banner' })).toBeEmptyDOMElement();
  });

  it('asks the loader again on the next mount after a failed load', async () => {
    mockLoad.mockRejectedValueOnce(new Error('chunk failed'));
    const { unmount } = mount(1);
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    unmount();

    mount(1);

    expect(await screen.findByRole('button', { name: 'notice:1' })).toBeInTheDocument();
    expect(mockLoad).toHaveBeenCalledTimes(2);
  });
});
