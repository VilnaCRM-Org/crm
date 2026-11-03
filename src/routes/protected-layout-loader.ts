import { lazy, type LazyExoticComponent } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';

import type {
  ProtectedLayout,
  ProtectedLayoutExport,
  ProtectedLayoutModule,
  ProtectedShell,
} from './types/protected-layout';
import type { ShellChunkFailureHandler, ShellSlotLoad, UserMenuSlot } from './types/shell-slot';

class ProtectedLayoutLoader {
  public create({ userMenu, report }: ProtectedShell): ProtectedLayout {
    const chunk = new ChunkRetryLoader<ProtectedLayoutModule>(
      () => import(/* webpackChunkName: "protected-layout" */ './protected-layout')
    );

    return {
      ProtectedRoute: this.component(chunk, 'ProtectedRoute'),
      AppLayout: this.component(chunk, 'AppLayout'),
      ...(userMenu === undefined ? {} : { userMenu: this.userMenu(chunk, userMenu, report) }),
    };
  }

  private component<TExport extends ProtectedLayoutExport>(
    chunk: ChunkRetryLoader<ProtectedLayoutModule>,
    name: TExport
  ): LazyExoticComponent<ProtectedLayoutModule[TExport]> {
    return lazy(() => chunk.load().then((module) => ({ default: module[name] })));
  }

  private userMenu(
    chunk: ChunkRetryLoader<ProtectedLayoutModule>,
    load: ShellSlotLoad,
    report: ShellChunkFailureHandler
  ): UserMenuSlot {
    return lazy(() =>
      chunk
        .load()
        .then(({ ShellSlotFactory }) => ({ default: new ShellSlotFactory(report).create(load) }))
    );
  }
}

export default new ProtectedLayoutLoader();
