import type { SessionClaims } from '@/lib/types/access/session';

import claimsMapper from './claims-mapper';

const JWT_SEGMENTS = 3;

export class SessionClaimsReader {
  public read(token: string | null): SessionClaims | null {
    const segment = this.payloadSegment(token);
    return segment === null ? null : this.decode(segment);
  }

  private payloadSegment(token: string | null): string | null {
    if (token === null) return null;
    const parts: readonly string[] = token.split('.');
    return this.isJwtParts(parts) ? parts[1] : null;
  }

  private isJwtParts(parts: readonly string[]): parts is readonly [string, string, string] {
    return parts.length === JWT_SEGMENTS;
  }

  private decode(segment: string): SessionClaims | null {
    try {
      return claimsMapper.map(JSON.parse(this.fromBase64Url(segment)));
    } catch {
      return null;
    }
  }

  private fromBase64Url(segment: string): string {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
}

const sessionClaimsReader = new SessionClaimsReader();

export default sessionClaimsReader;
