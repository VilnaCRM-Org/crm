import { act, render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import appShellLoader from '@/components/layouts/app-shell-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';

const mockShellLoad = jest.fn();

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockShellLoad() },
}));

jest.mock('@/components/ui-app-shell', () => ({
  __esModule: true,
  default: ({ signOut }: { signOut: () => void }): JSX.Element => (
    <button type="button" onClick={signOut}>
      loaded shell
    </button>
  ),
}));

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
});
