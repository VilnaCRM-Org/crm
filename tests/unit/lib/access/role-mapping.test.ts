import { ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import loadIsolated from '@tests/unit/utils/isolated-module';

type RoleMappingModule = typeof import('@/lib/access/role-mapping');

const loadRoleMapping = (): Promise<RoleMappingModule> =>
  loadIsolated(() => import('@/lib/access/role-mapping'));

describe('SERVER_ROLE_MAP', () => {
  it('maps the interim ROLE_USER server role to the member product role', async () => {
    const { default: SERVER_ROLE_MAP } = await loadRoleMapping();

    expect(SERVER_ROLE_MAP.ROLE_USER).toBe(ROLES.member);
  });

  it('maps every declared server role to a real product role', async () => {
    const { default: SERVER_ROLE_MAP } = await loadRoleMapping();

    Object.values(SERVER_ROLE_MAP).forEach((role) => {
      expect(permissionResolver.isRole(role)).toBe(true);
    });
  });

  it('declares no mapping for ROLE_SERVICE — a service token has no browser UI', async () => {
    const { default: SERVER_ROLE_MAP } = await loadRoleMapping();

    expect(Object.prototype.hasOwnProperty.call(SERVER_ROLE_MAP, 'ROLE_SERVICE')).toBe(false);
  });

  it('is frozen', async () => {
    const { default: SERVER_ROLE_MAP } = await loadRoleMapping();

    expect(Object.isFrozen(SERVER_ROLE_MAP)).toBe(true);
  });

  it('rejects a runtime write', async () => {
    const { default: SERVER_ROLE_MAP } = await loadRoleMapping();

    expect(() => Object.assign(SERVER_ROLE_MAP, { ROLE_USER: ROLES.admin })).toThrow(TypeError);
    expect(SERVER_ROLE_MAP.ROLE_USER).toBe(ROLES.member);
  });
});
