import { inject, injectable } from 'tsyringe';

import type { AuditCore } from '@/lib/access/audit-core';
import type { AuditEventInput, AuditLogger as AuditLoggerContract } from '@/lib/types/access/audit';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class AuditLogger implements AuditLoggerContract {
  constructor(@inject(ACCESS_TOKENS.AuditCore) private readonly core: AuditCore) {}

  public log(event: AuditEventInput): void {
    this.core.log(event);
  }
}
