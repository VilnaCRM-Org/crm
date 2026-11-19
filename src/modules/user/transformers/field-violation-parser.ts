import { injectable } from 'tsyringe';

import type {
  FieldViolation,
  FieldViolationSet,
} from '@/modules/user/types/user-service/user-service-failure';

const TAKEN_MESSAGES: ReadonlySet<string> = new Set([
  'This email address is already registered',
  'Ця email-адреса вже зареєстрована',
]);

const VIOLATION_PROPERTIES: readonly string[] = [
  'email',
  'token',
  'newPassword',
  'initials',
  'password',
  'twoFactorCode',
];

@injectable()
export default class FieldViolationParser {
  public parse(message: string): FieldViolationSet | null {
    const lines = message.split(/\r?\n/).filter((line) => line.trim() !== '');
    const items: FieldViolation[] = [];
    for (const line of lines) {
      const violation = this.violationOf(line);
      if (violation) items.push(violation);
    }
    if (items.length === 0) return null;
    return { items, complete: items.length === lines.length };
  }

  private violationOf(message: string): FieldViolation | null {
    const path = VIOLATION_PROPERTIES.find((property) => message.startsWith(`${property}:`));
    if (path === undefined) return null;
    const text = message.slice(path.length + 1).trim();
    return { path, reason: TAKEN_MESSAGES.has(text) ? 'taken' : 'other' };
  }
}
