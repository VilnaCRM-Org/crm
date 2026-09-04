import type { Permission } from './permission';
import type { Principal } from './principal';

export interface Policy<TSubject> {
  readonly permission: Permission;
  isSatisfiedBy(principal: Principal, subject: TSubject): boolean;
}

export interface ContactSubject {
  readonly id: string;
  readonly tenantId: string;
  readonly ownerId: string;
}
