import { readFileSync } from 'node:fs';
import path from 'node:path';

import catalogueCache, { CatalogueCache } from '@/lib/access/catalogue-cache';
import { buildUserId } from '@tests/builders';

describe('CatalogueCache', () => {
  let cache: CatalogueCache;

  beforeEach(() => {
    cache = new CatalogueCache();
  });

  it('exports a shared singleton instance', () => {
    expect(catalogueCache).toBeInstanceOf(CatalogueCache);
  });

  it('reports a miss for a sid nothing was ever cached under', () => {
    expect(cache.get(buildUserId())).toBeUndefined();
    expect(cache.getCatalogueVersion(buildUserId())).toBeUndefined();
  });

  it('returns the cached value and version on a hit for the same sid', () => {
    const sid = buildUserId();
    const catalogue = { roles: [] };

    cache.set(sid, catalogue, 'v1');

    expect(cache.get(sid)).toBe(catalogue);
    expect(cache.getCatalogueVersion(sid)).toBe('v1');
  });

  it('reports a miss under a different sid — a second login never reads the first', () => {
    const catalogue = { roles: [] };
    cache.set(buildUserId(), catalogue, 'v1');

    expect(cache.get(buildUserId())).toBeUndefined();
  });

  it('replaces the entry wholesale when a new catalogueVersion arrives for the same sid', () => {
    const sid = buildUserId();
    const first = { roles: ['first'] };
    const second = { roles: ['second'] };

    cache.set(sid, first, 'v1');
    cache.set(sid, second, 'v2');

    expect(cache.get(sid)).toBe(second);
    expect(cache.get(sid)).not.toBe(first);
    expect(cache.getCatalogueVersion(sid)).toBe('v2');
  });

  it('reports a miss for every sid after clear — nothing stale survives', () => {
    const sid = buildUserId();
    cache.set(sid, { roles: [] }, 'v1');

    cache.clear();

    expect(cache.get(sid)).toBeUndefined();
    expect(cache.getCatalogueVersion(sid)).toBeUndefined();
  });

  // Architecture D6 / story dependency note: this cache stores an opaque value because the
  // catalogue's own type belongs to the repository that parses it, not to this store. A source
  // scan is the only way to pin "imports nothing at all" as a real, checked contract.
  it('imports nothing at all', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../../../../src/lib/access/catalogue-cache.ts'),
      'utf8'
    );

    expect(source).not.toMatch(/^\s*import\s/m);
  });
});
