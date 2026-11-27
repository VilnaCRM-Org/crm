import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useNotificationOutletStore from '@/lib/notifications/use-notification-outlet-store';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import useSocialLinks from '@/modules/user/features/settings/hooks/use-social-links';
import type {
  SocialLinkFocusReturn,
  SocialLinks,
} from '@/modules/user/features/settings/types/social-link/social-links';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';
import { resetClientStores } from '@tests/utils/reset-client-stores';

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

const i18n = createSettingsLocaleI18n('en', []);

const listed = (items: readonly string[]): object => ({ kind: 'listed', linked: { items } });

const UNAVAILABLE = { kind: 'failed', reason: 'unavailable' };

const CHANNEL = 'crm.socialLink';

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const setup = async (
  returnFocusRef: SocialLinkFocusReturn = { current: null }
): Promise<{ result: { current: SocialLinks }; unmount: () => void }> => {
  const view = renderHook(() => useSocialLinks(returnFocusRef), { wrapper });
  await act(async () => undefined);
  return view;
};

describe('useSocialLinks', () => {
  beforeEach(() => {
    Object.values(mockProvider).forEach((method) => method.mockReset());
    mockUseService.mockClear();
    resetClientStores();
    mockProvider.linked.mockResolvedValue(listed(['github']));
  });

  afterEach(() => jest.restoreAllMocks());

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

  it('shows no failure for a read that ended the session', async () => {
    mockProvider.linked.mockResolvedValue({ kind: 'failed', reason: 'session_ended' });
    const { result } = await setup();

    expect(result.current.status).toBe('loading');
    act(() => result.current.retry());
    expect(result.current.status).toBe('loading');
    expect(mockProvider.linked).toHaveBeenCalledTimes(1);
  });

  it('reads again only after a failure, and recovers', async () => {
    mockProvider.linked.mockResolvedValueOnce(UNAVAILABLE);
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
    mockProvider.linked.mockResolvedValue(UNAVAILABLE);
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
    const { result } = renderHook(() => useSocialLinks({ current: null }), {
      wrapper,
      reactStrictMode: true,
    });

    expect(answers).toHaveLength(2);
    await act(async () => {
      answers[1]?.(listed(['github']));
    });
    await act(async () => answers[0]?.(UNAVAILABLE));

    expect(result.current.status).toBe('ready');
  });

  it('removes only the unlinked provider and points the return target at its tile', async () => {
    mockProvider.linked.mockResolvedValue(listed(['google', 'github']));
    mockProvider.unlink.mockResolvedValue({ kind: 'changed' });
    const control = document.createElement('button');
    const returnFocusRef: SocialLinkFocusReturn = { current: null };
    const { result } = await setup(returnFocusRef);

    await act(() => result.current.unlink({ ...google, controlRef: { current: control } }));

    expect(result.current.linked).toEqual({ items: ['github'] });
    expect(useNotificationOutletStore.getState().raised.items).toHaveLength(1);
    expect(returnFocusRef.current).toBe(control);
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
    const popup = {
      opener: null,
      closed: false,
      location: { replace: jest.fn() },
      close: jest.fn(),
    };
    jest.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    FakeBroadcastChannel.install();
    const { result } = await setup();

    let pending: Promise<void> = Promise.resolve();
    await act(async () => {
      pending = result.current.link(google);
    });
    FakeBroadcastChannel.deliver(
      { provider: 'google', state: 'link.a', code: 'c', error: null },
      CHANNEL
    );
    await act(() => pending);
    FakeBroadcastChannel.uninstall();

    expect(result.current.linked).toEqual({ items: ['github', 'google'] });
  });
});
