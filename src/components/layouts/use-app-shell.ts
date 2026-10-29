import { type ComponentType, lazy, useLayoutEffect, useRef, useState } from 'react';

import type { AppShellModuleLoader } from '@/components/types/layouts/app-layout-frame';
import type { UIAppShellProps } from '@/components/types/ui-app-shell';
import type { ShellFailureHandler } from '@/routes/types/shell-slot';

import AppShellPlaceholders from './app-shell-placeholders';

export default function useAppShell(
  shellLoader: AppShellModuleLoader,
  onShellFailure: ShellFailureHandler | undefined
): ComponentType<UIAppShellProps> {
  const report = useRef(onShellFailure);
  useLayoutEffect(() => {
    report.current = onShellFailure;
  });
  const [AppShell] = useState<ComponentType<UIAppShellProps>>(() =>
    lazy(() =>
      shellLoader.load().catch((error: unknown) => {
        report.current?.(error);

        return { default: AppShellPlaceholders };
      })
    )
  );

  return AppShell;
}
