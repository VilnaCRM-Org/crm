import '@testing-library/jest-dom';
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
  isCurrent: jest.Mock;
  show: jest.Mock;
  result: { current: ReturnType<typeof useEmailResend> };
  rerender: () => void;
  unmount: () => void;
} => {
  const adopt = jest.fn();
  const confirm = jest.fn();
  const isCurrent = jest.fn(() => true);
  const show = jest.fn();
  const toasts = { toasts: { items: [] }, announcement: '', alert: '', show, dismiss: jest.fn() };
  const view = renderHook(() => useEmailResend(user, { adopt, confirm, isCurrent }, toasts), {
    wrapper,
  });
  return { adopt, confirm, isCurrent, show, ...view };
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
    await act(async () => settle({ kind: 'sent', confirmed: false }));
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
      mockResend.mockResolvedValue({ kind: 'sent', confirmed });
      const { result, adopt, confirm, show } = setup();

      await act(async () => {
        result.current.resend();
      });

      expect(confirm).toHaveBeenCalledWith(user.email, confirmed);
      expect(adopt).not.toHaveBeenCalled();
      expect(show).toHaveBeenCalledWith({
        items: [{ tone: 'success', message: 'Посилання для підтвердження надіслано повторно' }],
      });
    }
  );

  it('moves focus to the e-mail field when the payload says the address is confirmed', async () => {
    mockResend.mockResolvedValue({ kind: 'sent', confirmed: true });
    const email = document.createElement('input');
    email.id = 'email';
    document.body.appendChild(email);
    const { result } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(email).toHaveFocus();
    email.remove();
  });

  it('leaves focus alone when the address is still unconfirmed', async () => {
    mockResend.mockResolvedValue({ kind: 'sent', confirmed: false });
    const email = document.createElement('input');
    email.id = 'email';
    document.body.appendChild(email);
    const { result } = setup();

    await act(async () => {
      result.current.resend();
    });

    expect(email).not.toHaveFocus();
    email.remove();
  });

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

  it.each<ProfileResendOutcome>([
    { kind: 'sent', confirmed: true },
    { kind: 'failed', reason: 'transient' },
  ])(
    'publishes nothing for a $kind resend once its e-mail is no longer current',
    async (outcome) => {
      let settle: (value: ProfileResendOutcome) => void = () => undefined;
      mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
      const field = document.createElement('input');
      field.id = 'email';
      document.body.appendChild(field);
      const { result, confirm, isCurrent, show } = setup();
      act(() => {
        result.current.resend();
      });

      isCurrent.mockReturnValue(false);
      await act(async () => settle(outcome));

      expect(isCurrent).toHaveBeenCalledWith(user.email);
      expect(confirm).not.toHaveBeenCalled();
      expect(show).not.toHaveBeenCalled();
      expect(field).not.toHaveFocus();
      expect(result.current.isSubmitting).toBe(false);
      field.remove();
    }
  );

  it('publishes nothing when the component unmounts while the request is in flight', async () => {
    let settle: (outcome: ProfileResendOutcome) => void = () => undefined;
    mockResend.mockReturnValue(new Promise((resolve) => (settle = resolve)));
    const { result, confirm, show, unmount } = setup();
    act(() => {
      result.current.resend();
    });
    const signal = mockResend.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    await act(async () => settle({ kind: 'sent', confirmed: true }));

    expect(signal.aborted).toBe(true);
    expect(show).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
