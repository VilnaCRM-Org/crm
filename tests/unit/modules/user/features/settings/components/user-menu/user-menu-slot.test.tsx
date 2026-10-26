import 'reflect-metadata';
import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import featureFlagService from '@/config/runtime/feature-flag-service';
import i18n from '@/i18n';
import loader from '@/modules/user/features/settings/components/user-menu/current-user-menu-loader';
import UserMenuSlot from '@/modules/user/features/settings/components/user-menu/user-menu-slot';
import renderShell from '@tests/unit/utils/render-shell';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

const mockRead = jest.fn();

jest.mock('@/providers/di', () => {
  const Mapper = jest.requireActual('@/modules/user/store/user-display-name-mapper').default;
  const tokens = jest.requireActual('@/modules/user/config/tokens').default;
  const mapper = new Mapper();
  const provider = { read: (signal: AbortSignal): unknown => mockRead(signal) };

  return {
    __esModule: true,
    useService: (token: symbol): unknown => (token === tokens.ProfileProvider ? provider : mapper),
  };
});

describe('UserMenuSlot', () => {
  beforeEach(() => {
    stubViewportWidth(1440);
    mockRead.mockReset();
    mockRead.mockReturnValue(new Promise(() => undefined));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('registers the user menu catalog for both locales', () => {
    expect(i18n.getResource('uk', 'translation', 'user_menu.sign_out')).toBe('Вийти');
    expect(i18n.getResource('en', 'translation', 'user_menu.sign_out')).toBe('Sign out');
  });

  it('renders a Sign out only menu and loads and reads nothing while the flag is off', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(false);
    const load = jest.spyOn(loader, 'load');
    const user = userEvent.setup();
    renderShell(<UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Sign out']);
    expect(load).not.toHaveBeenCalled();
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('shows the operable name-less chip while the flag is on, then reads once', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const user = userEvent.setup();
    renderShell(<UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('keeps the pending chip operable and reports the chunk failure exactly once', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const failure = new Error('chunk failed');
    jest.spyOn(loader, 'load').mockRejectedValue(failure);
    const onChunkFailure = jest.fn();
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderShell(<UserMenuSlot signOut={signOut} onChunkFailure={onChunkFailure} />);

    await waitFor(() => expect(onChunkFailure).toHaveBeenCalledTimes(1));
    await act(async () => new Promise((done) => setTimeout(done, 400)));
    await user.click(screen.getByRole('button', { name: 'User menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(onChunkFailure).toHaveBeenCalledWith('app-shell:current-user', failure);
    expect(onChunkFailure).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockRead).not.toHaveBeenCalled();
  });
});
