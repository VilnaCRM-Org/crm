import type { ComponentType, ReactNode } from 'react';

export interface AppProvidersProps {
  children: ReactNode;
}

export interface MuiThemeShellProps {
  children?: ReactNode;
}

export type ComponentModule = { default: ComponentType };

export type MuiThemeShellModule = { default: ComponentType<MuiThemeShellProps> };
