import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';

let mockNoticeLoads = 0;
let mockNoticeFailures: Error[] = [];

jest.mock('@auth/components/recovery-codes-notice', () => {
  mockNoticeLoads += 1;
  const failure = mockNoticeFailures.shift();
  if (failure) throw failure;
  return {
    __esModule: true,
    default: ({ count, onDismiss }: { count: number; onDismiss: () => void }): JSX.Element => (
      <button type="button" onClick={onDismiss}>
        notice:{count}
      </button>
    ),
  };
});

jest.mock('@/providers/mui-theme/mui-theme-shell-loader', () => ({
  __esModule: true,
  default: {
    load: (): Promise<unknown> =>
      Promise.resolve({
        default: ({ children }: { children: ReactNode }): JSX.Element => (
          <div role="group" aria-label="theme shell">
            {children}
          </div>
        ),
      }),
  },
}));

const chunkError = (): Error => {
  const error = new Error('Loading chunk recovery-codes-notice failed.');
  error.name = 'ChunkLoadError';
  return error;
};

const loadLoader = (): Promise<
  typeof import('@auth/components/protected-route/recovery-notice-loader')
> => import('@auth/components/protected-route/recovery-notice-loader');

describe('recoveryNoticeLoader', () => {
  beforeEach(() => {
    jest.resetModules();
    mockNoticeLoads = 0;
    mockNoticeFailures = [];
  });

  it('is a ThemedChunkLoader', async () => {
    const { default: loader } = await loadLoader();
    const { default: ThemedChunkLoader } =
      await import('@/providers/mui-theme/themed-chunk-loader');

    expect(loader).toBeInstanceOf(ThemedChunkLoader);
  });

  it('loads the notice inside the MUI theme shell and forwards its props', async () => {
    const onDismiss = jest.fn();
    const { default: loader } = await loadLoader();
    const { default: Notice } = await loader.load();

    render(<Notice count={2} onDismiss={onDismiss} />);
    act(() => screen.getByRole('button', { name: 'notice:2' }).click());

    expect(screen.getByRole('group', { name: 'theme shell' })).toContainElement(
      screen.getByRole('button', { name: 'notice:2' })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(mockNoticeLoads).toBe(1);
  });

  it('requests the notice chunk once however often it is loaded', async () => {
    const { default: loader } = await loadLoader();

    await loader.load();
    await loader.load();

    expect(mockNoticeLoads).toBe(1);
  });

  it('retries once when the notice chunk fails to load', async () => {
    mockNoticeFailures = [chunkError()];
    const { default: loader } = await loadLoader();

    const { default: Notice } = await loader.load();
    render(<Notice count={1} onDismiss={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'notice:1' })).toBeInTheDocument();
    expect(mockNoticeLoads).toBe(2);
  });

  it('rejects after a second chunk failure and loads again on the next call', async () => {
    const failure = chunkError();
    mockNoticeFailures = [chunkError(), failure];
    const { default: loader } = await loadLoader();

    await expect(loader.load()).rejects.toBe(failure);
    await expect(loader.load()).resolves.toHaveProperty('default');
    expect(mockNoticeLoads).toBe(3);
  });
});
