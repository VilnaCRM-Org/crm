export interface ModuleLoader<TModule> {
  load(): Promise<TModule>;
}

export interface ModuleLoaders<TModule> {
  readonly items: readonly ModuleLoader<TModule>[];
}
