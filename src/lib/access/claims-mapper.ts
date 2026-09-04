import type { SessionClaims } from '@/lib/types/access/session';

export class ClaimsMapper {
  public map(raw: unknown): SessionClaims | null {
    if (!this.isRecord(raw)) return null;
    return {
      sub: this.asString(raw.sub),
      email: this.asString(raw.email),
      roles: this.asStringList(raw.roles),
      tenantId: this.asString(raw.tenantId),
      tenants: this.asTenants(raw.tenants),
      flags: this.asFlags(raw.flags),
    };
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asStringList(value: unknown): readonly string[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  private asTenants(value: unknown): SessionClaims['tenants'] {
    if (!Array.isArray(value)) return undefined;
    return value
      .filter((entry): entry is Record<string, unknown> => this.isRecord(entry))
      .filter((entry) => typeof entry.id === 'string' && typeof entry.name === 'string')
      .map((entry) => ({ id: entry.id as string, name: entry.name as string }));
  }

  private asFlags(value: unknown): SessionClaims['flags'] {
    if (!this.isRecord(value)) return undefined;
    const booleans = Object.entries(value).filter(
      (entry): entry is [string, boolean] => typeof entry[1] === 'boolean'
    );
    return Object.fromEntries(booleans);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

const claimsMapper = new ClaimsMapper();

export default claimsMapper;
