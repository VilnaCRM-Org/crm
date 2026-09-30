export interface ModuleLoader<TModule> {
  load(): Promise<TModule>;
}
