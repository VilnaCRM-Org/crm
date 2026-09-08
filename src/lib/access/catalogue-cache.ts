// Dependency-free by design (architecture D6): the catalogue's own type lands with the
// repository that parses it (story 2.4), so this store stays opaque to it and imports nothing
// at all — not even a type. It exists purely to answer "do I already have this session's
// catalogue" without forcing a synchronous fetch onto the paint path.
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

  // A full overwrite, never a merge: a payload for the same sid but a different
  // catalogueVersion replaces the entry wholesale, exactly like a payload for a new sid.
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
