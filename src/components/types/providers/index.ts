import type { ComponentType, ReactNode } from 'react';

export interface AppProvidersProps {
  children: ReactNode;
}

export interface MuiThemeShellProps {
  children?: ReactNode;
}

export type ComponentModule<TProps extends object = Record<never, never>> = {
  default: ComponentType<TProps>;
};

export type MuiThemeShellModule = { default: ComponentType<MuiThemeShellProps> };
