import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import type {
  BellOutcomeNoticeProps,
  NotificationChunkModule,
  NotificationChunkReporter,
  NotificationHistoryPanelProps,
} from '@/modules/user/features/notifications';

type ChunkProps = BellOutcomeNoticeProps & NotificationHistoryPanelProps;

interface LoaderModule {
  readonly default: {
    readonly load: (
      report: NotificationChunkReporter
    ) => Promise<NotificationChunkModule<ChunkProps>>;
  };
}

interface LoaderCase {
  readonly chunk: string;
  readonly component: string;
  readonly requireLoader: () => LoaderModule;
}

const CASES: readonly LoaderCase[] = [
  {
    chunk: 'notifications-notice',
    component: '@/modules/user/features/notifications/components/bell-outcome-notice',
    requireLoader: () =>
      jest.requireActual(
        '@/modules/user/features/notifications/components/bell-outcome-notice-loader'
      ),
  },
  {
    chunk: 'notifications-history',
    component: '@/modules/user/features/notifications/components/notification-history-panel',
    requireLoader: () =>
      jest.requireActual(
        '@/modules/user/features/notifications/components/notification-history-panel-loader'
      ),
  },
];

const chunkModule = (): { default: () => null } => ({ default: () => null });

const failingWith =
  (failure: Error): (() => never) =>
  () => {
    throw failure;
  };

describe.each(CASES)('the loader of the $chunk chunk', ({ chunk, component, requireLoader }) => {
  const source = `app-shell:${chunk}`;

  const chunkFailure = (): Error =>
    Object.assign(new Error(`Loading chunk ${chunk} failed.`), { name: 'ChunkLoadError' });

  const withLoader = (
    factory: jest.Mock,
    run: (loader: LoaderModule['default']) => Promise<void>
  ): Promise<void> =>
    jest.isolateModulesAsync(async () => {
      jest.doMock(component, factory);
      await run(requireLoader().default);
    });

  afterEach(() => jest.dontMock(component));

  it('imports the chunk once however often it is loaded', async () => {
    const factory = jest.fn(chunkModule);

    await withLoader(factory, async (loader) => {
      const first = await loader.load(jest.fn());
      const second = await loader.load(jest.fn());

      expect(first).toBe(second);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  it('re-imports once after a first chunk-load error and reports nothing', async () => {
    const report = jest.fn();
    const factory = jest
      .fn()
      .mockImplementationOnce(failingWith(chunkFailure()))
      .mockImplementation(chunkModule);

    await withLoader(factory, async (loader) => {
      const module = await loader.load(report);

      expect(factory).toHaveBeenCalledTimes(2);
      expect(report).not.toHaveBeenCalled();
      expect(module.default).toBeDefined();
    });
  });

  it('reports once and resolves to an empty component when the import fails twice', async () => {
    const report = jest.fn();
    const failure = chunkFailure();

    await withLoader(jest.fn(failingWith(failure)), async (loader) => {
      const { default: Empty } = await loader.load(report);
      const view = render(
        <Empty bellRef={{ current: null }} records={{ items: [] }} onMarkAllRead={jest.fn()} />
      );

      expect(report).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledWith(source, failure);
      expect(view.container).toBeEmptyDOMElement();
    });
  });

  it('reports a failure that is not a chunk error without a second import', async () => {
    const report = jest.fn();
    const failure = new Error('boom');
    const factory = jest.fn(failingWith(failure));

    await withLoader(factory, async (loader) => {
      await loader.load(report);

      expect(factory).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledWith(source, failure);
    });
  });
});
