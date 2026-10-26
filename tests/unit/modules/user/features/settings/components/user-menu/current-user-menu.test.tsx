import 'reflect-metadata';
import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CurrentMenu from '@/modules/user/features/settings/components/user-menu/current-user-menu';
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

describe('CurrentMenu', () => {
  beforeEach(() => {
    stubViewportWidth(1440);
    mockRead.mockReset();
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('shows the chip name-less and operable at once, then the name once read', async () => {
    const user = userEvent.setup();
    mockRead.mockResolvedValue({
      kind: 'ok',
      user: {
        id: 'u',
        fullName: 'Петренко Олена Іванівна',
        email: 'o@example.com',
        confirmed: true,
      },
    });
    renderShell(<CurrentMenu signOut={jest.fn()} onAvatar={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'User menu' }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    await user.keyboard('{Escape}');

    await screen.findByRole('button', { name: 'Олена Петренко, User menu' });
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('stays name-less and operable when the read fails, with no error text', async () => {
    mockRead.mockResolvedValue({ kind: 'failed', reason: 'transient' });
    renderShell(<CurrentMenu signOut={jest.fn()} onAvatar={jest.fn()} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('signs out through the menu', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    mockRead.mockReturnValue(new Promise(() => undefined));
    renderShell(<CurrentMenu signOut={signOut} onAvatar={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'User menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('publishes the same monogram avatar the chip shows once the user is read', async () => {
    stubViewportWidth(375);
    const onAvatar = jest.fn();
    mockRead.mockResolvedValue({
      kind: 'ok',
      user: {
        id: 'u',
        fullName: 'Петренко Олена Іванівна',
        email: 'o@example.com',
        confirmed: true,
      },
    });
    renderShell(<CurrentMenu signOut={jest.fn()} onAvatar={onAvatar} />);

    await screen.findByRole('button', { name: 'Олена Петренко, User menu' });
    const { container } = renderShell(<>{onAvatar.mock.calls.at(-1)?.[0]}</>);

    expect(container).toHaveTextContent('ОП');
    expect(mockRead).toHaveBeenCalledTimes(1);
  });
});
