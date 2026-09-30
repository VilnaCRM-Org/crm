import { useTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { Component, type JSX, type ReactNode, Suspense } from 'react';

import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import routeMapper from '@/routes/route-mapper';
import type { AppRouteObject } from '@/routes/types/app-route';
import { paletteColors } from '@/styles/colors';
import { buildToken } from '@tests/builders';

const mockShellLoad = jest.fn();

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: { load: (): Promise<unknown> => mockShellLoad() },
}));

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk mui-theme failed.'), { name: 'ChunkLoadError' });

class Catcher extends Component<{ children: ReactNode }, { error: Error | null }> {
  public override state = { error: null };

  public static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  public override render(): ReactNode {
    const { error } = this.state;
    const { children } = this.props;
    return error ? <p>caught: {(error as Error).message}</p> : children;
  }
}

function ThemedPage(): JSX.Element {
  return <p>{useTheme().palette.primary.main}</p>;
}

const mount = (route: AppRouteObject): void => {
  const { element } = routeMapper.map(route, 'main');
  render(
    <Catcher>
      <Suspense fallback={<p>loading</p>}>{element}</Suspense>
    </Catcher>,
    { onCaughtError: jest.fn() }
  );
};

describe('route mapper MUI theme chunk', () => {
  let reload: jest.SpyInstance;

  beforeEach(() => {
    window.sessionStorage.clear();
    reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockShellLoad.mockReset();
  });

  it('renders every page inside the application theme', async () => {
    const { default: MuiThemeShell } = jest.requireActual<
      typeof import('@/providers/mui-theme/mui-theme-shell')
    >('@/providers/mui-theme/mui-theme-shell');
    mockShellLoad.mockResolvedValue({ default: MuiThemeShell });

    mount({
      path: `/${buildToken()}`,
      guard: 'protected',
      load: () => Promise.resolve({ default: ThemedPage }),
    });

    expect(await screen.findByText(paletteColors.primary.main)).toBeInTheDocument();
  });

  it('reloads a public page once when the theme chunk keeps failing', async () => {
    const path = `/${buildToken()}`;
    mockShellLoad.mockRejectedValue(chunkFailure());
    mount({ path, guard: 'public', load: () => Promise.resolve({ default: ThemedPage }) });

    await screen.findByText('loading');
    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(`crm:chunk-reload:${path}`)).toBe('1');
  });

  it('hands a protected page whose theme chunk fails to the route error boundary', async () => {
    mockShellLoad.mockRejectedValue(chunkFailure());
    mount({
      index: true,
      guard: 'protected',
      load: () => Promise.resolve({ default: ThemedPage }),
    });

    expect(await screen.findByText('caught: Loading chunk mui-theme failed.')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
