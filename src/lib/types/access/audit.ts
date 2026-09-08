export type AuditEventType =
  | 'login'
  | 'logout'
  | 'tenant_switch'
  | 'permission_denied'
  | 'sensitive_action'
  | 'access_role_unmapped'
  | 'access_unknown_mutation';

export type AuditMetadata = Readonly<Record<string, string>>;

export type DenialReason = 'permission' | 'membership';

export interface AuditSubject {
  readonly principalId: string | null;
  readonly tenantId: string | null;
}

export interface AuditEventInput {
  readonly type: AuditEventType;
  readonly metadata?: AuditMetadata;
  readonly subject?: AuditSubject;
}

export interface AuditEvent extends AuditSubject {
  readonly type: AuditEventType;
  readonly metadata?: AuditMetadata;
  readonly at: string;
}

export interface AuditSink {
  record(event: AuditEvent): void;
}

export interface AuditLogger {
  log(event: AuditEventInput): void;
}
