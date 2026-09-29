import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import MuiThemeShell from '@/providers/mui-theme/mui-theme-shell';
import muiThemeShellLoader from '@/providers/mui-theme/mui-theme-shell-loader';

describe('muiThemeShellLoader', () => {
  it('loads the theme shell through the chunk-recovery loader', async () => {
    expect(muiThemeShellLoader).toBeInstanceOf(ChunkRetryLoader);

    await expect(muiThemeShellLoader.load()).resolves.toMatchObject({ default: MuiThemeShell });
  });
});
