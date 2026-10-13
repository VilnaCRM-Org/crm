export interface SandboxDemoCredentials {
  readonly email: string;
  readonly password: string;
}

export interface SandboxDemoSession {
  readonly email: string;
  readonly token: string;
}

export type SandboxDemoLocation = Pick<Location, 'hostname'>;

export type SandboxDemoStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SandboxDemoHost {
  readonly location?: SandboxDemoLocation | undefined;
  readonly localStorage: SandboxDemoStorage;
}
