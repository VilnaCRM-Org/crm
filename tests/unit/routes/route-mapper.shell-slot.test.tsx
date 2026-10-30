import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, Suspense, useCallback } from 'react';

import routeMapper from '@/routes/route-mapper';
import type { ShellSlotProps } from '@/routes/types/shell-slot';
import observabilityCore from '@/services/observability/observability-core';

function LoadedSlot({ signOut, onChunkFailure }: ShellSlotProps): JSX.Element {
  const failInner = useCallback(
    () => onChunkFailure('app-shell:current-user', 'inner'),
    [onChunkFailure]
  );

  return (
    <>
      <button type="button" onClick={signOut}>
        sign out
      </button>
      <button type="button" onClick={failInner}>
        fail inner
      </button>
    </>
  );
}

describe('RouteMapper shell slot', () => {
  let capture: jest.SpyInstance;

  beforeEach(() => {
    capture = jest.spyOn(observabilityCore, 'captureError').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds a slot that renders the loaded user menu with the outlet sign-out', async () => {
    const signOut = jest.fn();
    const Slot = routeMapper.shellSlot(() => Promise.resolve({ default: LoadedSlot }));
    render(
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={signOut} onAvatar={jest.fn()} />
      </Suspense>
    );

    await userEvent.setup().click(await screen.findByRole('button', { name: 'sign out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(capture).not.toHaveBeenCalled();
  });

  it('captures the second user-menu failure with its source and no other context', async () => {
    const failure = new Error('boom');
    const Slot = routeMapper.shellSlot(() => Promise.reject(failure));
    render(
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={jest.fn()} onAvatar={jest.fn()} />
      </Suspense>
    );

    await waitFor(() => expect(capture).toHaveBeenCalledTimes(1));

    expect(capture).toHaveBeenCalledWith(failure, { source: 'app-shell:user-menu' });
  });

  it('captures a current-user failure the loaded slot hands back with that source', async () => {
    const Slot = routeMapper.shellSlot(() => Promise.resolve({ default: LoadedSlot }));
    render(
      <Suspense fallback={<p>pending</p>}>
        <Slot signOut={jest.fn()} onAvatar={jest.fn()} />
      </Suspense>
    );

    await userEvent.setup().click(await screen.findByRole('button', { name: 'fail inner' }));

    expect(capture).toHaveBeenCalledWith('inner', { source: 'app-shell:current-user' });
  });

  it('builds a reporter bound to one source for the shell chunk', () => {
    const failure = new Error('shell');

    routeMapper.chunkFailureReporter('app-shell:load')(failure);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(failure, { source: 'app-shell:load' });
  });
});
