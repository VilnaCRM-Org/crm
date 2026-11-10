import { act, render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import appShellLoader from '@/components/layouts/app-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

const mockShellLoad = jest.fn();
const mockShellImport = { failures: 0, attempts: 0 };

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockShellLoad() },
}));

jest.mock('@/components/ui-app-shell', () => {
  mockShellImport.attempts += 1;
  if (mockShellImport.failures > 0) {
    mockShellImport.failures -= 1;
    throw Object.assign(new Error('Loading chunk ui-app-shell failed.'), {
      name: 'ChunkLoadError',
    });
  }

  return {
    __esModule: true,
    default: ({ signOut }: { signOut: () => void }): JSX.Element => (
      <button type="button" onClick={signOut}>
        loaded shell
      </button>
    ),
  };
});

describe('appShellLoader', () => {
  beforeEach(() => {
    mockShellLoad.mockResolvedValue({
      default: ({ children }: { children?: JSX.Element }): JSX.Element => (
        <div role="group" aria-label="theme shell">
          {children}
        </div>
      ),
    });
  });

  afterEach(() => {
    mockShellLoad.mockReset();
    mockShellImport.failures = 0;
    mockShellImport.attempts = 0;
  });

  it('is a ThemedChunkLoader around the ui-app-shell chunk', () => {
    expect(appShellLoader).toBeInstanceOf(ThemedChunkLoader);
  });

  it('loads the shell module inside the MUI theme shell and forwards its props', async () => {
    const signOut = jest.fn();
    const { default: Shell } = await appShellLoader.load();

    render(<Shell signOut={signOut} />);
    act(() => screen.getByRole('button', { name: 'loaded shell' }).click());

    expect(screen.getByRole('group', { name: 'theme shell' })).toContainElement(
      screen.getByRole('button', { name: 'loaded shell' })
    );
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockShellLoad).toHaveBeenCalledTimes(1);
  });

  it('re-imports the shell chunk once when the first import fails with a chunk error', async () => {
    mockShellImport.failures = 1;
    mockShellImport.attempts = 0;
    let loaded: unknown = null;

    jest.resetModules();
    const { default: freshLoader } = await import('@/components/layouts/app-shell-loader');
    loaded = await freshLoader.load();

    expect(loaded).toEqual({ default: expect.any(Function) });
    expect(mockShellImport.attempts).toBe(2);
  });

  it('rejects when the shell chunk fails twice in a row', async () => {
    mockShellImport.failures = 2;
    mockShellImport.attempts = 0;
    let failure: unknown = null;

    jest.resetModules();
    const { default: freshLoader } = await import('@/components/layouts/app-shell-loader');
    failure = await freshLoader.load().catch((caught: unknown) => caught);

    expect(failure).toMatchObject({ name: 'ChunkLoadError' });
    expect(mockShellImport.attempts).toBe(2);
  });
});
