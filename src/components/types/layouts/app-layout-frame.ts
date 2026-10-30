import type { AppLayoutProps } from '@/components/types/layouts/app-layout';
import type { ComponentModule } from '@/components/types/providers';
import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';

export type AppShellModuleLoader = ModuleLoader<ComponentModule<UIAppShellProps>>;

export interface AppLayoutFrameProps extends AppLayoutProps {
  readonly shellLoader: AppShellModuleLoader;
}
