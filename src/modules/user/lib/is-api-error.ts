import type { APIError } from '@/modules/user/types/lib/is-api-error';

class ApiErrorGuard {
  public is(err: unknown): err is APIError {
    if (typeof err !== 'object' || err === null) return false;
    const record = err as Record<string, unknown>;
    return this.hasStringProp(record, 'code') && this.hasStringProp(record, 'message');
  }

  private hasStringProp(obj: Record<string, unknown>, key: string): boolean {
    return key in obj && typeof obj[key] === 'string';
  }
}

const apiErrorGuard = new ApiErrorGuard();

export default apiErrorGuard;
