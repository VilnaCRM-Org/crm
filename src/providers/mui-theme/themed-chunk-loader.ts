import { createElement, type ReactElement } from 'react';

import type { ComponentModule, MuiThemeShellModule } from '@/components/types/providers';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';

export default class ThemedChunkLoader {
  constructor(
    private readonly content: ModuleLoader<ComponentModule>,
    private readonly shell: ModuleLoader<MuiThemeShellModule>
  ) {}

  public async load(): Promise<ComponentModule> {
    const [{ default: Content }, { default: Shell }] = await Promise.all([
      this.content.load(),
      this.shell.load(),
    ]);

    function Themed(): ReactElement {
      return createElement(Shell, null, createElement(Content));
    }

    return { default: Themed };
  }
}
