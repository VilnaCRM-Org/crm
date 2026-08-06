import { injectable } from 'tsyringe';

import auditCore from '@/lib/access/audit-core';
import type { AuditEventInput, AuditLogger as AuditLoggerContract } from '@/lib/types/access/audit';

@injectable()
export default class AuditLogger implements AuditLoggerContract {
  public log(event: AuditEventInput): void {
    auditCore.log(event);
  }
}
