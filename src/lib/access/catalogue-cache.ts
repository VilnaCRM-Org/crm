export class CatalogueCache {
  private sid: string | null = null;

  private catalogueVersion: string | null = null;

  private catalogue: unknown;

  public get(sid: string): unknown {
    return this.isCurrent(sid) ? this.catalogue : undefined;
  }

  public getCatalogueVersion(sid: string): string | undefined {
    return this.isCurrent(sid) ? (this.catalogueVersion as string) : undefined;
  }

  public set(sid: string, catalogue: unknown, catalogueVersion: string): void {
    this.sid = sid;
    this.catalogue = catalogue;
    this.catalogueVersion = catalogueVersion;
  }

  public clear(): void {
    this.sid = null;
    this.catalogue = undefined;
    this.catalogueVersion = null;
  }

  private isCurrent(sid: string): boolean {
    return this.sid === sid;
  }
}

const catalogueCache = new CatalogueCache();

export default catalogueCache;
