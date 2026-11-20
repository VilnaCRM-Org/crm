import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import type {
  NotificationChunkReporter,
  NotificationHistoryPanelModule,
} from '@/modules/user/features/notifications';

const BASE = '@/modules/user/features/notifications/components';
const PANEL = `${BASE}/notification-history-panel`;
const LOADER = `${BASE}/notification-history-panel-loader`;

const chunkFailure = (): Error =>
  Object.assign(new Error('Loading chunk notifications-history failed.'), {
    name: 'ChunkLoadError',
  });

interface Scenario {
  readonly loader: {
    readonly load: (report: NotificationChunkReporter) => Promise<NotificationHistoryPanelModule>;
  };
  readonly factory: jest.Mock;
}

const withLoader = async (
  factory: jest.Mock,
  run: (scenario: Scenario) => Promise<void>
): Promise<void> => {
  await jest.isolateModulesAsync(async () => {
    jest.doMock(PANEL, factory);
    const { default: loader }: { default: Scenario['loader'] } = await import(LOADER);
    await run({ loader, factory });
  });
};

const panelModule = (): { default: () => null } => ({ default: () => null });

describe('NotificationHistoryPanelLoader', () => {
  afterEach(() => jest.dontMock(PANEL));

  it('imports the panel chunk once however often it is loaded', async () => {
    const factory = jest.fn(panelModule);

    await withLoader(factory, async ({ loader }) => {
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
      .mockImplementationOnce(() => {
        throw chunkFailure();
      })
      .mockImplementation(panelModule);

    await withLoader(factory, async ({ loader }) => {
      const module = await loader.load(report);

      expect(factory).toHaveBeenCalledTimes(2);
      expect(report).not.toHaveBeenCalled();
      expect(module.default).toBeDefined();
    });
  });

  it('reports once and resolves to an empty component when the import fails twice', async () => {
    const report = jest.fn();
    const failure = chunkFailure();
    const factory = jest.fn(() => {
      throw failure;
    });

    await withLoader(factory, async ({ loader }) => {
      const module: NotificationHistoryPanelModule = await loader.load(report);
      const Empty = module.default;
      const view = render(<Empty records={{ items: [] }} onMarkAllRead={jest.fn()} />);

      expect(report).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledWith('app-shell:notifications-history', failure);
      expect(view.container).toBeEmptyDOMElement();
    });
  });

  it('reports a failure that is not a chunk error without a second import', async () => {
    const report = jest.fn();
    const failure = new Error('boom');
    const factory = jest.fn(() => {
      throw failure;
    });

    await withLoader(factory, async ({ loader }) => {
      await loader.load(report);

      expect(factory).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledWith('app-shell:notifications-history', failure);
    });
  });
});
