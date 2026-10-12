export interface SandboxDemoCredentials {
  readonly email: string;
  readonly password: string;
}

export interface SandboxDemoSession {
  readonly email: string;
  readonly token: string;
}

export interface SandboxDemoHost {
  readonly location?: Pick<Location, 'hostname'> | undefined;
  readonly localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
}
