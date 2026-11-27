import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type MouseEvent, useCallback, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';

import UINotificationOutlet from '@/components/ui-notification-outlet';
import useNotifications from '@/hooks/use-notifications';
import SocialNetworks from '@/modules/user/features/settings/components/social-networks';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import FakeBroadcastChannel from '@tests/unit/utils/fake-broadcast-channel';
import OutcomeNoticeHeader from '@tests/unit/utils/outcome-notice-header';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockProvider = {
  linked: jest.fn(),
  start: jest.fn(),
  complete: jest.fn(),
  unlink: jest.fn(),
};

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

const LINK_GOOGLE = 'Google: підключити обліковий запис (відкриється нове вікно)';
const UNLINK_GOOGLE = 'Відключити Google';
const CLOSE = 'Закрити сповіщення';
const SAVE = 'Зберегти';

const button = (name: string): HTMLElement => screen.getByRole('button', { name });

function SettingsStage(): JSX.Element {
  const returnFocusRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { raise } = useNotifications();
  const save = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      returnFocusRef.current = event.currentTarget;
      raise({ items: [{ kind: 'success', messageKey: 'settings.toasts.saved' }] });
    },
    [raise]
  );

  return (
    <>
      <OutcomeNoticeHeader />
      <main>
        <h1 ref={headingRef} tabIndex={-1}>
          Налаштування
        </h1>
        <button type="button" onClick={save}>
          {SAVE}
        </button>
        <SocialNetworks returnFocusRef={returnFocusRef} />
        <UINotificationOutlet returnFocusRef={returnFocusRef} fallbackFocusRef={headingRef} />
      </main>
    </>
  );
}

const stage = (i18n: ReturnType<typeof createSettingsLocaleI18n>): JSX.Element => (
  <I18nextProvider i18n={i18n}>
    <SettingsStage />
  </I18nextProvider>
);

const mount = async (linked: readonly string[], control: string): Promise<() => void> => {
  mockProvider.linked.mockResolvedValue({ kind: 'listed', linked: { items: linked } });
  const i18n = createSettingsLocaleI18n('uk', []);
  const { rerender } = render(stage(i18n));
  await screen.findByRole('button', { name: control });
  return () => rerender(stage(i18n));
};

const unlinkGoogle = async (): Promise<void> => {
  await userEvent.click(button(UNLINK_GOOGLE));
  const row = screen.getByRole('group', { name: 'Відключити Google?' });
  await userEvent.click(within(row).getByRole('button', { name: 'Відключити' }));
  await screen.findByRole('button', { name: LINK_GOOGLE });
  await screen.findByRole('button', { name: CLOSE });
};

const answerGoogleLink = async (completed: object): Promise<void> => {
  mockProvider.start.mockResolvedValue({
    kind: 'started',
    authorizationUrl: 'https://provider.example',
    state: 'link.a',
  });
  mockProvider.complete.mockResolvedValue(completed);
  const popup = {
    opener: null,
    closed: false,
    location: { replace: jest.fn() },
    close: jest.fn(),
  };
  jest.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
  FakeBroadcastChannel.install();
  await mount([], LINK_GOOGLE);

  await userEvent.click(button(LINK_GOOGLE));
  FakeBroadcastChannel.deliver(
    { provider: 'google', state: 'link.a', code: 'c', error: null },
    'crm.socialLink'
  );
  await screen.findByRole('button', { name: UNLINK_GOOGLE });
  await screen.findByRole('button', { name: CLOSE });
};

const closeFirstNotice = async (): Promise<void> => {
  await userEvent.click(screen.getAllByRole('button', { name: CLOSE })[0] as HTMLElement);
};

const noticeCloses = (): HTMLElement[] => screen.queryAllByRole('button', { name: CLOSE });

describe('SocialNetworks notice focus return', () => {
  beforeEach(() => {
    Object.values(mockProvider).forEach((method) => method.mockReset());
    resetClientStores();
  });

  afterEach(() => {
    FakeBroadcastChannel.uninstall();
    jest.restoreAllMocks();
  });

  it.each([
    ['a link notice', { kind: 'changed' }],
    ['an already-linked notice', { kind: 'failed', reason: 'provider_linked' }],
  ])('returns the keyboard to the unlink control once %s closes', async (_name, completed) => {
    await answerGoogleLink(completed);
    await closeFirstNotice();

    expect(noticeCloses()).toHaveLength(0);
    expect(button(UNLINK_GOOGLE)).toHaveFocus();
  });

  it('returns the keyboard to the link button once an unlink notice closes', async () => {
    mockProvider.unlink.mockResolvedValue({ kind: 'changed' });
    await mount(['google'], UNLINK_GOOGLE);

    await unlinkGoogle();
    await closeFirstNotice();

    expect(noticeCloses()).toHaveLength(0);
    expect(button(LINK_GOOGLE)).toHaveFocus();
  });

  it('returns the keyboard to the unchanged tile once a failure notice closes', async () => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    await mount([], LINK_GOOGLE);

    await userEvent.click(button(LINK_GOOGLE));
    await screen.findByRole('button', { name: CLOSE });
    await closeFirstNotice();

    expect(noticeCloses()).toHaveLength(0);
    expect(button(LINK_GOOGLE)).toHaveFocus();
    expect(mockProvider.start).not.toHaveBeenCalled();
  });

  it('leaves a profile save that settles after the tile its own return target', async () => {
    mockProvider.unlink.mockResolvedValue({ kind: 'changed' });
    const rerender = await mount(['google'], UNLINK_GOOGLE);

    await unlinkGoogle();
    await userEvent.click(button(SAVE));
    rerender();
    await closeFirstNotice();
    expect(noticeCloses()).toHaveLength(1);
    await closeFirstNotice();

    expect(noticeCloses()).toHaveLength(0);
    expect(button(SAVE)).toHaveFocus();
    expect(button(LINK_GOOGLE)).not.toHaveFocus();
  });
});
