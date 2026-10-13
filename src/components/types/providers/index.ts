import type { ComponentType, ReactNode } from 'react';

export interface AppProvidersProps {
  children: ReactNode;
}

export interface MuiThemeShellProps {
  children?: ReactNode;
}

export interface ComponentModule<TProps> {
  default: ComponentType<TProps>;
}

export interface MuiThemeShellModule {
  default: ComponentType<MuiThemeShellProps>;
}
