import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { StrictMode, type JSX, type ReactNode } from 'react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';

import useTwoFactorSettings from '@/modules/user/features/settings/hooks/use-two-factor-settings';
import type { TwoFactorStatus } from '@/routes/types/protected-outlet-context';
import {
  buildOtpauthUri,
  buildRecoveryCodeSet,
  buildTotpCode,
  buildTotpSecret,
} from '@tests/builders';

import {
  failedOutcome as failed,
  type TwoFactorSettingsOutcome,
  type TwoFactorSettingsProps,
} from './two-factor-test-deps';

const mockProvider = {
  setup: jest.fn(),
  confirm: jest.fn(),
  disable: jest.fn(),
  regenerate: jest.fn(),
};
const mockUseService = jest.fn((_token?: symbol): object => mockProvider);

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (token: symbol): object => mockUseService(token),
}));

const setTwoFactorStatus = jest.fn();
const signOut = jest.fn();

const otpauthUri = buildOtpauthUri();
const secret = buildTotpSecret();
const recoveryCodes = buildRecoveryCodeSet();
const SETUP: TwoFactorSettingsOutcome = {
  kind: 'changed',
  settings: { status: 'disabled', otpauthUri, secret, recoveryCodes: null },
};
const CODES: TwoFactorSettingsOutcome = {
  kind: 'changed',
  settings: { status: 'enabled', otpauthUri: null, secret: null, recoveryCodes },
};
const DISABLED: TwoFactorSettingsOutcome = {
  kind: 'changed',
  settings: { status: 'disabled', otpauthUri: null, secret: null, recoveryCodes: null },
};

const mount = (
  status: TwoFactorStatus = 'disabled',
  strict = false
): RenderHookResult<TwoFactorSettingsProps, unknown> => {
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    const tree = (
      <MemoryRouter>
        <Routes>
          <Route
            element={<Outlet context={{ signOut, twoFactorStatus: status, setTwoFactorStatus }} />}
          >
            <Route index element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  }
  return renderHook(() => useTwoFactorSettings(), { wrapper: Wrapper });
};

describe('useTwoFactorSettings', () => {
  beforeEach(() => {
    Object.values(mockProvider).forEach((fn) => fn.mockReset());
    mockUseService.mockClear();
    setTwoFactorStatus.mockReset();
    signOut.mockReset();
  });

  describe('on mount', () => {
    it.each([
      ['enabled', 'on', 'enabled'],
      ['disabled', 'off', 'disabled'],
      ['unknown', 'off', 'disabled'],
    ] as const)('shows the %s status as the %s view', (status, view, entityStatus) => {
      const { result } = mount(status);

      expect(result.current.view).toEqual({
        view,
        fieldError: null,
        banner: null,
        statusCode: null,
      });
      expect(result.current.settings).toEqual({
        status: entityStatus,
        otpauthUri: null,
        secret: null,
        recoveryCodes: null,
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('sends no request on mount, under StrictMode too', () => {
      mount('enabled', true);
      mount('disabled', true);

      Object.values(mockProvider).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it('resolves the provider through the container token', () => {
      mount();

      expect(mockUseService).toHaveBeenCalledWith(expect.any(Symbol));
      expect(String(mockUseService.mock.calls[0]?.[0])).toBe('Symbol(TwoFactorSettingsProvider)');
    });
  });

  describe('enrolment', () => {
    it('walks start, confirm and done, holding secrets only where they show', async () => {
      mockProvider.setup.mockResolvedValue(SETUP);
      mockProvider.confirm.mockResolvedValue(CODES);
      const { result } = mount();

      await act(async () => result.current.callbacks.start());
      expect(result.current.view.view).toBe('setup');
      expect(result.current.settings).toEqual(SETUP.kind === 'changed' ? SETUP.settings : null);

      await act(async () => result.current.callbacks.confirm({ twoFactorCode: buildTotpCode() }));
      expect(result.current.view.view).toBe('codes');
      expect(result.current.settings).toEqual({
        status: 'enabled',
        otpauthUri: null,
        secret: null,
        recoveryCodes,
      });
      expect(setTwoFactorStatus).toHaveBeenCalledWith('enabled');

      act(() => result.current.callbacks.done());
      expect(result.current.view).toEqual({
        view: 'on',
        fieldError: null,
        banner: null,
        statusCode: null,
      });
      expect(result.current.settings).toEqual({
        status: 'enabled',
        otpauthUri: null,
        secret: null,
        recoveryCodes: null,
      });
    });

    it('drops the secrets when setup was not initiated', async () => {
      mockProvider.setup.mockResolvedValue(SETUP);
      mockProvider.confirm.mockResolvedValue(failed('setup_not_initiated'));
      const { result } = mount();
      await act(async () => result.current.callbacks.start());

      await act(async () => result.current.callbacks.confirm({ twoFactorCode: buildTotpCode() }));

      expect(result.current.view.view).toBe('off');
      expect(result.current.view.statusCode).toBe('stale');
      expect(result.current.settings).toEqual({
        status: 'disabled',
        otpauthUri: null,
        secret: null,
        recoveryCodes: null,
      });
    });

    it('moves to on with already_on when 2FA turns out to be enabled', async () => {
      mockProvider.setup.mockResolvedValue(failed('already_enabled'));
      const { result } = mount();

      await act(async () => result.current.callbacks.start());

      expect(result.current.view.view).toBe('on');
      expect(result.current.view.statusCode).toBe('already_on');
      expect(result.current.settings.status).toBe('enabled');
      expect(setTwoFactorStatus).toHaveBeenCalledWith('enabled');
    });

    it('keeps the setup view and its secrets for a wrong code', async () => {
      mockProvider.setup.mockResolvedValue(SETUP);
      mockProvider.confirm.mockResolvedValue(failed('invalid_code'));
      const { result } = mount();
      await act(async () => result.current.callbacks.start());

      await act(async () => result.current.callbacks.confirm({ twoFactorCode: buildTotpCode() }));

      expect(result.current.view.fieldError).toBe('invalid_code');
      expect(result.current.settings).toMatchObject({ otpauthUri, secret });
    });
  });

  describe('disable and regenerate', () => {
    it('disables from the on view, going off with the disabled status code', async () => {
      mockProvider.disable.mockResolvedValue(DISABLED);
      const { result } = mount('enabled');

      act(() => result.current.callbacks.openDisable());
      expect(result.current.view.view).toBe('disable');
      await act(async () => result.current.callbacks.disable({ twoFactorCode: buildTotpCode() }));

      expect(result.current.view.view).toBe('off');
      expect(result.current.view.statusCode).toBe('disabled');
      expect(result.current.settings.status).toBe('disabled');
      expect(setTwoFactorStatus).toHaveBeenCalledWith('disabled');
    });

    it.each([
      ['openDisable', 'disable'],
      ['openRegenerate', 'regenerate'],
    ] as const)('cancels %s back to the on view', (open, view) => {
      const { result } = mount('enabled');
      act(() => result.current.callbacks[open]());
      expect(result.current.view.view).toBe(view);

      act(() => result.current.callbacks.cancel());

      expect(result.current.view.view).toBe('on');
    });

    it('regenerates into the codes view and back to on after done', async () => {
      mockProvider.regenerate.mockResolvedValue(CODES);
      const { result } = mount('enabled');

      act(() => result.current.callbacks.openRegenerate());
      await act(async () => result.current.callbacks.regenerate());
      expect(result.current.view.view).toBe('codes');
      expect(result.current.settings.recoveryCodes).toEqual(recoveryCodes);

      act(() => result.current.callbacks.done());
      expect(result.current.settings.recoveryCodes).toBeNull();
      expect(result.current.view.view).toBe('on');
    });

    it('signs in again through the outlet signOut, once, and changes no view', async () => {
      const { result } = mount('enabled');

      act(() => result.current.callbacks.signInAgain());

      expect(signOut).toHaveBeenCalledTimes(1);
      expect(result.current.view.view).toBe('on');
      expect(setTwoFactorStatus).not.toHaveBeenCalled();
    });

    it('shows the reauth view without ending the session', async () => {
      mockProvider.regenerate.mockResolvedValue(failed('reauth_required'));
      const { result } = mount('enabled');
      act(() => result.current.callbacks.openRegenerate());

      await act(async () => result.current.callbacks.regenerate());

      expect(result.current.view.view).toBe('reauth');
      expect(signOut).not.toHaveBeenCalled();
    });
  });

  describe('failures', () => {
    it('keeps everything for session_ended and calls nothing', async () => {
      mockProvider.setup.mockResolvedValue(failed('session_ended'));
      const { result } = mount();

      await act(async () => result.current.callbacks.start());

      expect(result.current.view.view).toBe('off');
      expect(result.current.view.banner).toBeNull();
      expect(setTwoFactorStatus).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    });

    it.each([
      ['rate_limited', 'rate_limited'],
      ['network', 'transient'],
      ['server', 'transient'],
    ] as const)('shows the %s banner and keeps the view', async (reason, banner) => {
      mockProvider.setup.mockResolvedValue(failed(reason));
      const { result } = mount();

      await act(async () => result.current.callbacks.start());

      expect(result.current.view).toEqual({
        view: 'off',
        fieldError: null,
        banner,
        statusCode: null,
      });
    });

    it('retries exactly one more identical request from each view', async () => {
      mockProvider.setup.mockResolvedValue(failed('network'));
      const { result } = mount();
      await act(async () => result.current.callbacks.start());

      await act(async () => result.current.callbacks.retry());

      expect(mockProvider.setup).toHaveBeenCalledTimes(2);
    });

    it('retries the last confirm from the setup view', async () => {
      mockProvider.setup.mockResolvedValue(SETUP);
      mockProvider.confirm.mockResolvedValue(failed('network'));
      const { result } = mount();
      await act(async () => result.current.callbacks.start());
      const code = buildTotpCode();
      await act(async () => result.current.callbacks.confirm({ twoFactorCode: code }));

      await act(async () => result.current.callbacks.retry());

      expect(mockProvider.confirm).toHaveBeenCalledTimes(2);
      expect(mockProvider.confirm.mock.calls[1]?.[0]).toEqual({ twoFactorCode: code });
    });

    it('retries the last disable and the regenerate from their confirmations', async () => {
      mockProvider.disable.mockResolvedValue(failed('network'));
      mockProvider.regenerate.mockResolvedValue(failed('network'));
      const { result } = mount('enabled');
      act(() => result.current.callbacks.openDisable());
      await act(async () => result.current.callbacks.disable({ twoFactorCode: buildTotpCode() }));
      await act(async () => result.current.callbacks.retry());
      act(() => result.current.callbacks.cancel());
      act(() => result.current.callbacks.openRegenerate());
      await act(async () => result.current.callbacks.regenerate());
      await act(async () => result.current.callbacks.retry());

      expect(mockProvider.disable).toHaveBeenCalledTimes(2);
      expect(mockProvider.regenerate).toHaveBeenCalledTimes(2);
    });
  });

  describe('busy state', () => {
    it.each([
      ['setup', (p: typeof mockProvider): jest.Mock => p.setup, 'start'],
      ['regenerate', (p: typeof mockProvider): jest.Mock => p.regenerate, 'regenerate'],
    ] as const)('reports busy while %s is in flight', (_name, pick, callback) => {
      pick(mockProvider).mockReturnValue(new Promise(() => undefined));
      const { result } = mount('enabled');

      act(() => {
        result.current.callbacks[callback]();
      });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('reports busy while a disable is in flight', () => {
      mockProvider.disable.mockReturnValue(new Promise(() => undefined));
      const { result } = mount('enabled');
      act(() => result.current.callbacks.openDisable());

      act(() => {
        result.current.callbacks.disable({ twoFactorCode: buildTotpCode() });
      });

      expect(result.current.isSubmitting).toBe(true);
    });

    it('reports busy while a confirm is in flight', async () => {
      mockProvider.setup.mockResolvedValue(SETUP);
      mockProvider.confirm.mockReturnValue(new Promise(() => undefined));
      const { result } = mount();
      await act(async () => result.current.callbacks.start());

      act(() => {
        result.current.callbacks.confirm({ twoFactorCode: buildTotpCode() });
      });

      expect(result.current.isSubmitting).toBe(true);
    });
  });
});
