import { lazy, type LazyExoticComponent } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type {
  ProtectedLayout,
  ProtectedLayoutExport,
  ProtectedLayoutModule,
  ProtectedShell,
  ShellSlotRequest,
} from './types/protected-layout';
import type { ShellChunkFailureHandler, ShellSlot } from './types/shell-slot';

class ProtectedLayoutLoader {
  public create({ userMenu, notifications, report }: ProtectedShell): ProtectedLayout {
    const chunk = new ChunkRetryLoader<ProtectedLayoutModule>(
      () => import(/* webpackChunkName: "protected-layout" */ './protected-layout')
    );

    return {
      ProtectedRoute: this.component(chunk, 'ProtectedRoute'),
      AppLayout: this.component(chunk, 'AppLayout'),
      ...(userMenu === undefined
        ? {}
        : {
            userMenu: this.slot(chunk, report, { load: userMenu, source: 'app-shell:user-menu' }),
          }),
      ...(notifications === undefined
        ? {}
        : {
            notifications: this.slot(chunk, report, {
              load: notifications,
              source: 'app-shell:notifications',
            }),
          }),
    };
  }

  private component<TExport extends ProtectedLayoutExport>(
    chunk: ChunkRetryLoader<ProtectedLayoutModule>,
    name: TExport
  ): LazyExoticComponent<ProtectedLayoutModule[TExport]> {
    return lazy(() => chunk.load().then((module) => ({ default: module[name] })));
  }

  private slot(
    chunk: ChunkRetryLoader<ProtectedLayoutModule>,
    report: ShellChunkFailureHandler,
    { load, source }: ShellSlotRequest
  ): ShellSlot {
    return lazy(() =>
      chunk.load().then(({ ShellSlotFactory }) => ({
        default: new ShellSlotFactory(report).create(load, source),
      }))
    );
  }
}

export default new ProtectedLayoutLoader();
