import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, Suspense, useCallback } from 'react';

import ShellSlotFactory from '@/routes/shell-slot-factory';
import type { ShellSlotProps } from '@/routes/types/shell-slot';

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk user-menu failed.'), { name: 'ChunkLoadError' });

function LoadedSlot({ signOut, onChunkFailure, onAvatar }: ShellSlotProps): JSX.Element {
  const failInner = useCallback(
    () => onChunkFailure('app-shell:current-user', 'inner'),
    [onChunkFailure]
  );
  const publish = useCallback(() => onAvatar('avatar copy'), [onAvatar]);

  return (
    <>
      <button type="button" onClick={signOut}>
        sign out
      </button>
      <button type="button" onClick={failInner}>
        fail inner
      </button>
      <button type="button" onClick={publish}>
        publish avatar
      </button>
    </>
  );
}

const mount = (
  Slot: ReturnType<ShellSlotFactory['create']>,
  signOut = jest.fn(),
  onAvatar = jest.fn()
): void => {
  render(
    <div role="group" aria-label="slot">
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={signOut} onAvatar={onAvatar} />
      </Suspense>
    </div>
  );
};

describe('ShellSlotFactory', () => {
  it('renders the loaded slot with the outlet sign-out and the failure handler bound', async () => {
    const report = jest.fn();
    const signOut = jest.fn();
    const Slot = new ShellSlotFactory(report).create(() =>
      Promise.resolve({ default: LoadedSlot })
    );
    mount(Slot, signOut);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'sign out' }));
    await user.click(screen.getByRole('button', { name: 'fail inner' }));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith('app-shell:current-user', 'inner');
  });

  it('hands the loaded slot the host avatar callback unchanged', async () => {
    const onAvatar = jest.fn();
    const Slot = new ShellSlotFactory(jest.fn()).create(() =>
      Promise.resolve({ default: LoadedSlot })
    );
    mount(Slot, jest.fn(), onAvatar);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'publish avatar' }));

    expect(onAvatar).toHaveBeenCalledTimes(1);
    expect(onAvatar).toHaveBeenCalledWith('avatar copy');
  });

  it('publishes no avatar from the empty slot a twice-failed chunk leaves', async () => {
    const report = jest.fn();
    const onAvatar = jest.fn();
    const Slot = new ShellSlotFactory(report).create(() => Promise.reject(chunkFailure()));
    mount(Slot, jest.fn(), onAvatar);

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));

    expect(onAvatar).not.toHaveBeenCalled();
  });

  it('shows the Suspense fallback while the chunk is pending', () => {
    const report = jest.fn();
    const Slot = new ShellSlotFactory(report).create(() => new Promise(() => undefined));

    mount(Slot);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(report).not.toHaveBeenCalled();
  });

  it('re-imports a chunk failure once and then renders the slot', async () => {
    const report = jest.fn();
    const load = jest
      .fn()
      .mockRejectedValueOnce(chunkFailure())
      .mockResolvedValueOnce({ default: LoadedSlot });
    const Slot = new ShellSlotFactory(report).create(load);

    mount(Slot);

    expect(await screen.findByRole('button', { name: 'sign out' })).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
    expect(report).not.toHaveBeenCalled();
  });

  it('renders an empty slot and reports user-menu once when the chunk fails twice', async () => {
    const report = jest.fn();
    const failure = chunkFailure();
    const load = jest.fn().mockRejectedValue(failure);
    const Slot = new ShellSlotFactory(report).create(load);

    mount(Slot);

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith('app-shell:user-menu', failure);
    expect(load).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByRole('group', { name: 'slot' })).toBeEmptyDOMElement());
  });

  it('reports a non-chunk failure at once, without a second import', async () => {
    const report = jest.fn();
    const failure = new Error('boom');
    const load = jest.fn().mockRejectedValue(failure);
    const Slot = new ShellSlotFactory(report).create(load);

    mount(Slot);

    await waitFor(() => expect(report).toHaveBeenCalledWith('app-shell:user-menu', failure));
    expect(load).toHaveBeenCalledTimes(1);
  });
});
