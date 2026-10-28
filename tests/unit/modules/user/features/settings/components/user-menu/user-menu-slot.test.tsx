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

const READ_USER = {
  kind: 'ok',
  user: { id: 'u', fullName: 'Петренко Олена Іванівна', email: 'o@example.com', confirmed: true },
};

type LoadedModule = Awaited<ReturnType<typeof loader.load>>;

function holdCurrentUserChunk(): () => Promise<void> {
  let release: (module: LoadedModule) => void = () => undefined;
  const held = new Promise<LoadedModule>((resolve) => {
    release = resolve;
  });
  jest.spyOn(loader, 'load').mockReturnValue(held);

  return async () => {
    const actual: LoadedModule = jest.requireActual(
      '@/modules/user/features/settings/components/user-menu/current-user-menu'
    );
    await act(async () => release(actual));
  };
}

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
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Sign out']);
    expect(load).not.toHaveBeenCalled();
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('shows the operable name-less chip while the flag is on, then reads once', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const user = userEvent.setup();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('keeps the open menu and its focused item when the current-user chunk resolves', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    mockRead.mockResolvedValue(READ_USER);
    const resolveChunk = holdCurrentUserChunk();
    const user = userEvent.setup();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
    );
    const chip = screen.getByRole('button', { name: 'User menu' });

    await user.click(chip);
    await user.keyboard('{ArrowDown}');
    const settingsItem = screen.getByRole('menuitem', { name: 'Settings' });
    expect(settingsItem).toHaveFocus();
    await resolveChunk();
    await screen.findByRole('button', { name: 'Олена Петренко, User menu' });

    expect(screen.getByRole('button', { name: 'Олена Петренко, User menu' })).toBe(chip);
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBe(settingsItem);
    expect(settingsItem).toHaveFocus();
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('keeps focus on the same chip node when the chunk resolves with the menu closed', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    mockRead.mockResolvedValue(READ_USER);
    const resolveChunk = holdCurrentUserChunk();
    const onAvatar = jest.fn();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={onAvatar} />
    );
    const chip = screen.getByRole('button', { name: 'User menu' });
    act(() => chip.focus());

    await resolveChunk();
    await screen.findByRole('button', { name: 'Олена Петренко, User menu' });

    expect(chip).toHaveFocus();
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toHaveTextContent('ОП');
  });

  it('keeps the same chip mounted across the chunk resolving and signs out from it', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const resolveChunk = holdCurrentUserChunk();
    const signOut = jest.fn();
    const user = userEvent.setup();
    renderShell(<UserMenuSlot signOut={signOut} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />);
    const pendingChip = screen.getByRole('button', { name: 'User menu' });

    await user.click(pendingChip);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    await resolveChunk();
    expect(screen.getByRole('button', { name: /User menu/u })).toBe(pendingChip);
    await user.click(pendingChip);
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledTimes(2);
  });

  it('keeps the pending chip operable and reports the chunk failure exactly once', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const failure = new Error('chunk failed');
    jest.spyOn(loader, 'load').mockRejectedValue(failure);
    const onChunkFailure = jest.fn();
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderShell(
      <UserMenuSlot signOut={signOut} onChunkFailure={onChunkFailure} onAvatar={jest.fn()} />
    );

    await waitFor(() => expect(onChunkFailure).toHaveBeenCalledTimes(1));
    await act(async () => new Promise((done) => setTimeout(done, 400)));
    await user.click(screen.getByRole('button', { name: 'User menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(onChunkFailure).toHaveBeenCalledWith('app-shell:current-user', failure);
    expect(onChunkFailure).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('publishes the no-data avatar copy while the flag is off, reading nothing', () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(false);
    const onAvatar = jest.fn();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={onAvatar} />
    );

    expect(onAvatar).toHaveBeenCalledTimes(1);
    const { container } = renderShell(<>{onAvatar.mock.calls[0]?.[0]}</>);
    expect(container).toContainHTML('PersonOutlinedIcon');
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('publishes the no-data avatar copy while the current user is pending', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    const onAvatar = jest.fn();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={onAvatar} />
    );

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toContainHTML('PersonOutlinedIcon');
  });

  it('keeps publishing the no-data avatar copy after the current-user chunk fails', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
    jest.spyOn(loader, 'load').mockRejectedValue(new Error('chunk failed'));
    const onAvatar = jest.fn();
    const onChunkFailure = jest.fn();
    renderShell(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={onChunkFailure} onAvatar={onAvatar} />
    );

    await waitFor(() => expect(onChunkFailure).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onAvatar).toHaveBeenLastCalledWith(expect.anything()));
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toContainHTML('PersonOutlinedIcon');
  });
});
