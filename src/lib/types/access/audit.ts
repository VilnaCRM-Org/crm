export type AuditEventType =
  'login' | 'logout' | 'tenant_switch' | 'permission_denied' | 'sensitive_action';

export type AuditMetadata = Readonly<Record<string, string>>;

export type DenialReason = 'permission' | 'membership';

export interface AuditEventInput {
  readonly type: AuditEventType;
  readonly metadata?: AuditMetadata;
}

export interface AuditEvent extends AuditEventInput {
  readonly at: string;
  readonly principalId: string | null;
  readonly tenantId: string | null;
}

export interface AuditSink {
  record(event: AuditEvent): void;
}

export interface AuditLogger {
  log(event: AuditEventInput): void;
}
