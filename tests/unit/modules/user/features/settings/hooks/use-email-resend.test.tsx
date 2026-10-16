import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useEmailResend from '@/modules/user/features/settings/hooks/use-email-resend';
import type { ProfileResendOutcome } from '@/modules/user/features/settings/types/user-profile';
import { buildUserEntity } from '@tests/builders';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';

const mockResend = jest.fn();
const mockProvider = { resend: mockResend };
const mockSubmitRuns: unknown[] = [];

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

jest.mock('@/hooks/use-abortable-submit', () => {
  const actual = jest.requireActual('@/hooks/use-abortable-submit');
  return {
    __esModule: true,
    default: (run: unknown): unknown => {
      mockSubmitRuns.push(run);
      return actual.default(run);
    },
  };
});

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <I18nextProvider i18n={createSettingsLocaleI18n('uk', ['en'])}>{children}</I18nextProvider>
);

const user = buildUserEntity({ confirmed: false });

const setup = (): {
  adopt: jest.Mock;
  confirm: jest.Mock;
  show: jest.Mock;
  result: { current: ReturnType<typeof useEmailResend> };
  rerender: () => void;
  unmount: () => void;
} => {
  const adopt = jest.fn();
  const confirm = jest.fn();
  const show = jest.fn();
  const toasts = { toasts: { items: [] }, announcement: '', show, dismiss: jest.fn() };
  const view = renderHook(() => useEmailResend(user, { adopt, confirm }, toasts), { wrapper });
  return { adopt, confirm, show, ...view };
};

describe('useEmailResend', () => {
  beforeEach(() => {
    mockResend.mockReset();
    mockSubmitRuns.length = 0;
  });

  it('sends one resend with the entity id for two calls before the first settles', async () => {
    let settle: (outcome: ProfileResendOutcome) => void = () => undefined;
    mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result } = setup();

    act(() => {
      result.current.resend();
      result.current.resend();
    });

    expect(mockResend).toHaveBeenCalledTimes(1);
    expect(mockResend.mock.calls[0]?.[0]).toBe(user.id);
    expect(result.current.isSubmitting).toBe(true);
    await act(async () => settle({ kind: 'confirmed', confirmed: false }));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('keeps the run handed to useAbortableSubmit stable across renders', () => {
    const { rerender } = setup();

    rerender();
    rerender();

    expect(new Set(mockSubmitRuns).size).toBe(1);
  });

  it.each([true, false])(
    'confirms with %s and shows the resent toast, never adopting',
    async (confirmed) => {
      mockResend.mockResolvedValue({ kind: 'confirmed', confirmed });
      const { result, adopt, confirm, show } = setup();

      await act(async () => {
        result.current.resend();
      });

      expect(confirm).toHaveBeenCalledWith(confirmed);
      expect(adopt).not.toHaveBeenCalled();
      expect(show).toHaveBeenCalledWith({
        items: [{ tone: 'success', message: 'Посилання для підтвердження надіслано повторно' }],
      });
    }
  );

  it.each([
    ['rate_limited', 'Забагато спроб. Спробуйте пізніше.'],
    ['transient', 'Не вдалося надіслати посилання. Спробуйте ще раз.'],
    ['rejected', 'Не вдалося надіслати посилання. Спробуйте ще раз.'],
  ] as const)('shows the %s failure as an error toast', async (reason, message) => {
    mockResend.mockResolvedValue({ kind: 'failed', reason });
    const { result, confirm, show } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(show).toHaveBeenCalledWith({ items: [{ tone: 'error', message }] });
    expect(confirm).not.toHaveBeenCalled();
  });

  it('does nothing when the session ended', async () => {
    mockResend.mockResolvedValue({ kind: 'failed', reason: 'session_ended' });
    const { result, confirm, show } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(show).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it('publishes nothing when the component unmounts while the request is in flight', async () => {
    let settle: (outcome: ProfileResendOutcome) => void = () => undefined;
    mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result, confirm, show, unmount } = setup();
    act(() => {
      result.current.resend();
    });
    const signal = mockResend.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    await act(async () => settle({ kind: 'confirmed', confirmed: true }));

    expect(signal.aborted).toBe(true);
    expect(show).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
