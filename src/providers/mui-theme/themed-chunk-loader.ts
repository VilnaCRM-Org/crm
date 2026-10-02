import { createElement, type ReactElement } from 'react';

import type { ComponentModule, MuiThemeShellModule } from '@/components/types/providers';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';

export default class ThemedChunkLoader<TProps extends object = Record<never, never>> {
  constructor(
    private readonly content: ModuleLoader<ComponentModule<TProps>>,
    private readonly shell: ModuleLoader<MuiThemeShellModule>
  ) {}

  public async load(): Promise<ComponentModule<TProps>> {
    const [{ default: Content }, { default: Shell }] = await Promise.all([
      this.content.load(),
      this.shell.load(),
    ]);

    function Themed(props: TProps): ReactElement {
      return createElement(Shell, null, createElement(Content, props));
    }

    return { default: Themed };
  }
}
