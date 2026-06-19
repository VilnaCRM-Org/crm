export default class LazyModuleLoader<TModule> {
  private promise: Promise<TModule> | null = null;

  constructor(private readonly importModule: () => Promise<TModule>) {}

  public load(): Promise<TModule> {
    if (!this.promise) {
      this.promise = this.importModule().catch((error) => {
        this.promise = null;
        throw error;
      });
    }

    return this.promise;
  }
}
