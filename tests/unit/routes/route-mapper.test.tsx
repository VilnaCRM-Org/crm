import { render, screen } from '@testing-library/react';
import { Component, type ReactNode, Suspense } from 'react';

import pageReloadNavigator from '@/lib/reliability/page-reload-navigator';
import routeMapper from '@/routes/route-mapper';
import type { AppRouteObject, PageModule } from '@/routes/types/app-route';
import { buildToken } from '@tests/builders';

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk 5 failed.'), { name: 'ChunkLoadError' });

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

const mount = (route: AppRouteObject): void => {
  const { element } = routeMapper.map(route, 'main');
  render(
    <Catcher>
      <Suspense fallback={<p>loading</p>}>{element}</Suspense>
    </Catcher>,
    { onCaughtError: jest.fn() }
  );
};

const pageModule = (text: string): PageModule => ({ default: (): ReactNode => <p>{text}</p> });

describe('route mapper chunk recovery (issue #147)', () => {
  let reload: jest.SpyInstance;

  beforeEach(() => {
    window.sessionStorage.clear();
    reload = jest.spyOn(pageReloadNavigator, 'reload').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a page whose chunk loads on the first try', async () => {
    const text = buildToken();
    mount({
      path: `/${buildToken()}`,
      guard: 'public',
      load: () => Promise.resolve(pageModule(text)),
    });

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('retries one chunk failure for any route before rendering', async () => {
    const text = buildToken();
    const load = jest
      .fn()
      .mockRejectedValueOnce(chunkFailure())
      .mockResolvedValue(pageModule(text));
    mount({ path: `/${buildToken()}`, guard: 'protected', load });

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads the document once for a public page whose chunk keeps failing', async () => {
    const path = `/${buildToken()}`;
    mount({ path, guard: 'public', load: () => Promise.reject(chunkFailure()) });

    await screen.findByText('loading');
    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(`crm:chunk-reload:${path}`)).toBe('1');
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByText(/caught:/)).not.toBeInTheDocument();
  });

  it('hands the second failure in a session to the route error boundary instead', async () => {
    const path = `/${buildToken()}`;
    window.sessionStorage.setItem(`crm:chunk-reload:${path}`, '1');
    mount({ path, guard: 'public', load: () => Promise.reject(chunkFailure()) });

    expect(await screen.findByText('caught: Loading chunk 5 failed.')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('never reloads a protected page — the in-memory token would not survive it', async () => {
    mount({ index: true, guard: 'protected', load: () => Promise.reject(chunkFailure()) });

    expect(await screen.findByText('caught: Loading chunk 5 failed.')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('keys the reload flag of an index route as "index"', async () => {
    mount({ index: true, guard: 'public', load: () => Promise.reject(chunkFailure()) });

    await screen.findByText('loading');
    await Promise.resolve();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('crm:chunk-reload:index')).toBe('1');
  });

  it('clears the reload flag once the page loads, so a later deploy may reload again', async () => {
    const path = `/${buildToken()}`;
    window.sessionStorage.setItem(`crm:chunk-reload:${path}`, '1');
    const text = buildToken();
    mount({ path, guard: 'public', load: () => Promise.resolve(pageModule(text)) });

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(`crm:chunk-reload:${path}`)).toBeNull();
  });
});
