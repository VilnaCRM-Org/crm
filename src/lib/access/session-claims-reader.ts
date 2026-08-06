import type { SessionClaims } from '@/lib/types/access/session';

import claimsMapper from './claims-mapper';

const JWT_SEGMENTS = 3;
const BASE64_BLOCK = 4;

export class SessionClaimsReader {
  public read(token: string | null): SessionClaims | null {
    const segment = this.payloadSegment(token);
    return segment === null ? null : claimsMapper.map(this.decode(segment));
  }

  private payloadSegment(token: string | null): string | null {
    const parts = token === null ? [] : token.split('.');
    return parts.length === JWT_SEGMENTS ? parts[1] : null;
  }

  private decode(segment: string): unknown {
    try {
      return JSON.parse(this.fromBase64Url(segment));
    } catch {
      return null;
    }
  }

  private fromBase64Url(segment: string): string {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (BASE64_BLOCK - (normalized.length % BASE64_BLOCK)) % BASE64_BLOCK;
    const binary = atob(normalized.padEnd(normalized.length + padding, '='));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
}

const sessionClaimsReader = new SessionClaimsReader();

export default sessionClaimsReader;
