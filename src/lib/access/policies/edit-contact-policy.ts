import { PERMISSIONS } from '@/lib/access/permission-catalog';
import type { Permission } from '@/lib/types/access/permission';
import type { ContactSubject, Policy } from '@/lib/types/access/policy';
import type { Principal } from '@/lib/types/access/principal';

export class EditContactPolicy implements Policy<ContactSubject> {
  public readonly permission: Permission = PERMISSIONS.contactWrite;

  public isSatisfiedBy(principal: Principal, subject: ContactSubject): boolean {
    if (principal.tenantId !== subject.tenantId) return false;
    if (!principal.permissions.includes(this.permission)) return false;
    return (
      subject.ownerId === principal.id ||
      principal.permissions.includes(PERMISSIONS.contactManageAll)
    );
  }
}

const editContactPolicy = new EditContactPolicy();

export default editContactPolicy;
