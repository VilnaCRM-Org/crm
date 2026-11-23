import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import useSocialLinks from '@/modules/user/features/settings/hooks/use-social-links';
import type { SocialLinks } from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';

import { github, google } from './social-link-test-deps';

const mockProvider = {
  linked: jest.fn(),
  start: jest.fn(),
  complete: jest.fn(),
  unlink: jest.fn(),
};
const mockUseService = jest.fn((_token: symbol) => mockProvider);

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (token: symbol): object => mockUseService(token),
}));

const show = jest.fn();
const toasts = { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() };
const i18n = createSettingsLocaleI18n('en', []);

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const setup = async (): Promise<{ result: { current: SocialLinks }; unmount: () => void }> => {
  const view = renderHook(() => useSocialLinks(toasts), { wrapper });
  await act(async () => undefined);
  return view;
};

describe('useSocialLinks', () => {
  beforeEach(() => {
    Object.values(mockProvider).forEach((method) => method.mockReset());
    mockUseService.mockClear();
    show.mockReset();
    mockProvider.linked.mockResolvedValue({ items: ['github'] });
  });

  it('reads the list once through the injected provider', async () => {
    mockProvider.linked.mockReturnValue(new Promise(() => undefined));
    const { result } = await setup();

    expect(mockUseService).toHaveBeenCalledWith(AUTH_TOKENS.SocialLinkProvider);
    expect(mockProvider.linked.mock.calls).toEqual([[expect.any(AbortSignal)]]);
    expect(result.current).toMatchObject({ status: 'loading', linked: { items: [] }, busy: false });
  });

  it('is ready with the linked providers', async () => {
    const { result } = await setup();

    expect(result.current).toMatchObject({ status: 'ready', linked: { items: ['github'] } });
  });

  it('reads again only after a failure, and recovers', async () => {
    mockProvider.linked.mockResolvedValueOnce(null);
    const { result } = await setup();
    expect(result.current.status).toBe('failed');

    act(() => result.current.retry());
    expect(result.current.status).toBe('retrying');
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockProvider.linked).toHaveBeenCalledTimes(2);
    act(() => result.current.retry());
    expect(result.current.status).toBe('ready');
    expect(mockProvider.linked).toHaveBeenCalledTimes(2);
  });

  it('fails again when the second read fails', async () => {
    mockProvider.linked.mockResolvedValue(null);
    const { result } = await setup();

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(mockProvider.linked).toHaveBeenCalledTimes(2);
  });

  it('aborts the read on unmount', async () => {
    const { unmount } = await setup();

    unmount();

    expect(mockProvider.linked.mock.calls[0]?.[0].aborted).toBe(true);
  });

  it('ignores the read StrictMode aborted', async () => {
    const answers: ((linked: unknown) => void)[] = [];
    mockProvider.linked.mockImplementation(() => new Promise((resolve) => answers.push(resolve)));
    const { result } = renderHook(() => useSocialLinks(toasts), { wrapper, reactStrictMode: true });

    expect(answers).toHaveLength(2);
    await act(async () => {
      answers[1]?.({ items: ['github'] });
    });
    await act(async () => answers[0]?.(null));

    expect(result.current.status).toBe('ready');
  });

  it('removes only the unlinked provider', async () => {
    mockProvider.linked.mockResolvedValue({ items: ['google', 'github'] });
    mockProvider.unlink.mockResolvedValue({ kind: 'changed' });
    const { result } = await setup();

    await act(() => result.current.unlink(google));

    expect(result.current.linked).toEqual({ items: ['github'] });
    expect(show).toHaveBeenCalledTimes(1);
  });

  it('is busy while a provider is unlinked, and unlinks nothing else meanwhile', async () => {
    let finish: (outcome: unknown) => void = () => undefined;
    mockProvider.unlink.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = await setup();
    let pending: Promise<void> = Promise.resolve();

    act(() => {
      pending = result.current.unlink(github);
      void result.current.unlink(google);
    });
    expect(result.current.busy).toBe(true);
    await act(async () => {
      finish({ kind: 'failed', reason: 'last_method' });
      await pending;
    });

    expect(result.current.busy).toBe(false);
    expect(result.current.linked).toEqual({ items: ['github'] });
    expect(mockProvider.unlink).toHaveBeenCalledTimes(1);
  });

  it('adds only the linked provider, once', async () => {
    mockProvider.start.mockResolvedValue({
      kind: 'started',
      authorizationUrl: 'https://provider.example',
      state: 'link.a',
    });
    mockProvider.complete.mockResolvedValue({ kind: 'changed' });
    const popup = { opener: null, location: { replace: jest.fn() }, close: jest.fn() };
    jest.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    FakeBroadcastChannel.install();
    const { result } = await setup();

    let pending: Promise<void> = Promise.resolve();
    await act(async () => {
      pending = result.current.link(google);
    });
    FakeBroadcastChannel.deliver({ provider: 'google', state: 'link.a', code: 'c', error: null });
    await act(() => pending);
    FakeBroadcastChannel.uninstall();

    expect(result.current.linked).toEqual({ items: ['github', 'google'] });
  });
});
