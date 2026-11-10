import '@testing-library/jest-dom';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, type ReactElement, useCallback } from 'react';
import { useNavigate } from 'react-router';

import i18n from '@/i18n';
import loader from '@/modules/user/features/settings/components/user-menu/current-user-menu-loader';
import UserMenuSlot from '@/modules/user/features/settings/components/user-menu/user-menu-slot';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import { buildFullName } from '@tests/builders';
import renderShell from '@tests/unit/utils/render-shell';
import { inertSession } from '@tests/unit/utils/session-outlet';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

const mockRead = jest.fn();

const identity = new UserDisplayNameMapper().fromFullName(buildFullName());

const READ_USER = { kind: 'ok', identity };

const renderSlot = (ui: ReactElement): ReturnType<typeof renderShell> =>
  renderShell(ui, { session: inertSession });

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

function GoToSettings(): JSX.Element {
  const navigate = useNavigate();
  const goToSettings = useCallback(() => void navigate('/settings'), [navigate]);

  return (
    <button type="button" onClick={goToSettings}>
      Go to settings
    </button>
  );
}

describe('UserMenuSlot', () => {
  beforeEach(() => {
    stubViewportWidth(1440);
    mockRead.mockReset();
    mockRead.mockReturnValue(new Promise(() => undefined));
    jest
      .spyOn(currentUserSource, 'read')
      .mockImplementation((_session, signal) => mockRead(signal));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('registers the user menu catalog for both locales', () => {
    expect(i18n.getResource('uk', 'translation', 'user_menu.sign_out')).toBe('Вийти');
    expect(i18n.getResource('en', 'translation', 'user_menu.sign_out')).toBe('Sign out');
  });

  it('shows the operable name-less chip, then reads once', async () => {
    const user = userEvent.setup();
    renderSlot(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'User menu' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('keeps the open menu and its focused item when the current-user chunk resolves', async () => {
    mockRead.mockResolvedValue(READ_USER);
    const resolveChunk = holdCurrentUserChunk();
    const user = userEvent.setup();
    renderSlot(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
    );
    const chip = screen.getByRole('button', { name: 'User menu' });

    await user.click(chip);
    await user.keyboard('{ArrowDown}');
    const settingsItem = screen.getByRole('menuitem', { name: 'Settings' });
    expect(settingsItem).toHaveFocus();
    await resolveChunk();
    await screen.findByRole('button', { name: `${identity.displayName}, User menu` });

    expect(screen.getByRole('button', { name: `${identity.displayName}, User menu` })).toBe(chip);
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBe(settingsItem);
    expect(settingsItem).toHaveFocus();
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('keeps focus on the same chip node when the chunk resolves with the menu closed', async () => {
    mockRead.mockResolvedValue(READ_USER);
    const resolveChunk = holdCurrentUserChunk();
    const onAvatar = jest.fn();
    renderSlot(<UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={onAvatar} />);
    const chip = screen.getByRole('button', { name: 'User menu' });
    act(() => chip.focus());

    await resolveChunk();
    await screen.findByRole('button', { name: `${identity.displayName}, User menu` });

    expect(chip).toHaveFocus();
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toHaveTextContent(identity.monogram);
  });

  it('keeps the same chip mounted across the chunk resolving and signs out from it', async () => {
    const resolveChunk = holdCurrentUserChunk();
    const signOut = jest.fn();
    const user = userEvent.setup();
    renderSlot(<UserMenuSlot signOut={signOut} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />);
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
    const failure = new Error('chunk failed');
    jest.spyOn(loader, 'load').mockRejectedValue(failure);
    const onChunkFailure = jest.fn();
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderSlot(
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

  it('reports a chunk failure to the handler of the latest render', async () => {
    const failure = new Error('chunk failed');
    let fail: (error: Error) => void = () => undefined;
    jest.spyOn(loader, 'load').mockReturnValue(
      new Promise<LoadedModule>((_resolve, reject) => {
        fail = reject;
      })
    );
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = renderSlot(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={first} onAvatar={jest.fn()} />
    );

    rerender(<UserMenuSlot signOut={jest.fn()} onChunkFailure={latest} onAvatar={jest.fn()} />);
    await act(async () => fail(failure));

    await waitFor(() => expect(latest).toHaveBeenCalledWith('app-shell:current-user', failure));
    expect(first).not.toHaveBeenCalled();
  });

  it('publishes the no-data avatar copy while the current user is pending', async () => {
    const onAvatar = jest.fn();
    renderSlot(<UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={onAvatar} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toContainHTML('PersonOutlinedIcon');
  });

  it('keeps publishing the no-data avatar copy after the current-user chunk fails', async () => {
    jest.spyOn(loader, 'load').mockRejectedValue(new Error('chunk failed'));
    const onAvatar = jest.fn();
    const onChunkFailure = jest.fn();
    renderSlot(
      <UserMenuSlot signOut={jest.fn()} onChunkFailure={onChunkFailure} onAvatar={onAvatar} />
    );

    await waitFor(() => expect(onChunkFailure).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onAvatar).toHaveBeenLastCalledWith(expect.anything()));
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);
    expect(container).toContainHTML('PersonOutlinedIcon');
  });

  it('drops the previous identity from the chip when the next read ends the session', async () => {
    mockRead.mockResolvedValueOnce(READ_USER);
    const resolveChunk = holdCurrentUserChunk();
    const user = userEvent.setup();
    renderSlot(
      <>
        <UserMenuSlot signOut={jest.fn()} onChunkFailure={jest.fn()} onAvatar={jest.fn()} />
        <GoToSettings />
      </>
    );
    await resolveChunk();
    await screen.findByRole('button', { name: `${identity.displayName}, User menu` });

    mockRead.mockResolvedValueOnce({ kind: 'failed', reason: 'session_ended' });
    await user.click(screen.getByRole('button', { name: 'Go to settings' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: `${identity.displayName}, User menu` })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
  });
});
