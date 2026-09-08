import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { DEFAULT_ROLE, PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import sessionFactory, { SessionFactory } from '@/lib/access/session-factory';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type { SessionInput, SessionSnapshot } from '@/lib/types/access/session';
import {
  buildAccessToken,
  buildClaims,
  buildEmail,
  buildPrincipal,
  buildTenantRef,
  buildUserId,
  encodeSegment,
} from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_TENANT_ID = 'default';
const UNKNOWN_ROLE = 'sorcerer';
const UNKNOWN_FLAG = 'billing-module';
const INHERITED_MEMBER_NAMES = [
  'toString',
  'constructor',
  'valueOf',
  'hasOwnProperty',
  '__proto__',
];

/**
 * The fallback tenant id is a module-level literal, so it is evaluated at import: loading the
 * module inside the test body is what attributes it to this test rather than to whichever
 * unrelated suite imported the factory first.
 */
const loadSessionFactory = (): Promise<typeof import('@/lib/access/session-factory')> =>
  loadIsolated(() => import('@/lib/access/session-factory'));

describe('SessionFactory', () => {
  const factory = new SessionFactory();
  const sink: { record: jest.Mock<void, [AuditEvent]> } & AuditSink = {
    record: jest.fn<void, [AuditEvent]>(),
  };

  const requireBuilt = (snapshot: SessionSnapshot | null): SessionSnapshot => {
    if (snapshot === null) throw new Error('expected the factory to build a session snapshot');
    return snapshot;
  };

  const requireSnapshot = (input: SessionInput): SessionSnapshot =>
    requireBuilt(factory.build(input));

  beforeEach(() => {
    sink.record.mockClear();
    auditCore.useSink(sink);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessState.clear();
  });

  it('exports a shared singleton instance', () => {
    expect(sessionFactory).toBeInstanceOf(SessionFactory);
  });

  it('returns null for a null token', () => {
    expect(factory.build({ token: null })).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(factory.build({ token: '', email: buildEmail() })).toBeNull();
  });

  it('mirrors the claimed identity and expands the claimed roles', () => {
    const tenant = buildTenantRef();
    const other = buildTenantRef();
    const claims = buildClaims({
      roles: [ROLES.manager],
      tenantId: tenant.id,
      tenants: [tenant, other],
      flags: {},
    });

    const snapshot = requireSnapshot({ token: buildAccessToken(claims) });

    expect(snapshot).toStrictEqual({
      principal: {
        id: claims.sub,
        email: claims.email,
        roles: [ROLES.manager],
        permissions: permissionResolver.expand([ROLES.manager]),
        tenantId: tenant.id,
        tenants: [tenant, other],
      },
      flags: {},
    });
    expect(snapshot.principal.permissions).toContain(PERMISSIONS.tenantSwitch);
    expect(snapshot.principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
  });

  it('discards unknown role strings and keeps the known ones', () => {
    const claims = buildClaims({ roles: [ROLES.admin, UNKNOWN_ROLE, ROLES.viewer] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([ROLES.admin, ROLES.viewer]);
    expect(principal.permissions).toStrictEqual(
      permissionResolver.expand([ROLES.admin, ROLES.viewer])
    );
  });

  it('maps the ROLE_USER server role to member and grants contact:write', () => {
    const claims = buildClaims({ roles: ['ROLE_USER'] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([ROLES.member]);
    expect(principal.permissions).toContain(PERMISSIONS.contactWrite);
    expect(sink.record).not.toHaveBeenCalled();
  });

  it('falls back to viewer and audits ROLE_SERVICE, which maps to nothing', () => {
    const claims = buildClaims({ roles: ['ROLE_SERVICE'] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'access_role_unmapped',
        metadata: { role: 'ROLE_SERVICE', correlationId: correlationIdSource.current() },
      })
    );
  });

  it('falls back to viewer and names a role in neither the map nor the Role union verbatim', () => {
    const claims = buildClaims({ roles: [UNKNOWN_ROLE] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'access_role_unmapped',
        metadata: { role: UNKNOWN_ROLE, correlationId: correlationIdSource.current() },
      })
    );
  });

  it('honours a mapped role and audits an unmapped one — neither swallows the other', () => {
    const claims = buildClaims({ roles: ['ROLE_USER', UNKNOWN_ROLE] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([ROLES.member]);
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'access_role_unmapped',
        metadata: { role: UNKNOWN_ROLE, correlationId: correlationIdSource.current() },
      })
    );
  });

  it.each(INHERITED_MEMBER_NAMES)(
    'refuses the inherited %s member of the role map and audits it as unmapped',
    (name) => {
      const claims = buildClaims({ roles: [name] });

      const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

      expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
      expect(principal.permissions).toStrictEqual(permissionResolver.expand([DEFAULT_ROLE]));
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(sink.record).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'access_role_unmapped',
          metadata: { role: name, correlationId: correlationIdSource.current() },
        })
      );
    }
  );

  it('attributes an unmapped role to the session being hydrated, not the published one', () => {
    const outgoing = buildPrincipal();
    accessState.setSession(outgoing, {});

    const { principal } = requireSnapshot({
      token: buildAccessToken(buildClaims({ roles: [UNKNOWN_ROLE] })),
    });

    expect(principal.id).not.toBe(outgoing.id);
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'access_role_unmapped',
        principalId: principal.id,
        tenantId: principal.tenantId,
      })
    );
  });

  it.each([
    { label: 'only unknown roles', roles: [UNKNOWN_ROLE] },
    { label: 'an empty role list', roles: [] },
  ])('falls back to the default role when the token claims $label', ({ roles }) => {
    const claims = buildClaims({ roles });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
    expect(principal.permissions).toStrictEqual(permissionResolver.expand([DEFAULT_ROLE]));
    expect(principal.permissions).not.toContain(PERMISSIONS.contactManageAll);
  });

  it('treats an absent roles claim as no claimed role at all, auditing nothing', () => {
    const { roles: _omitted, ...withoutRoles } = buildClaims();

    const { principal } = requireSnapshot({
      token: buildAccessToken(withoutRoles as Parameters<typeof buildAccessToken>[0]),
    });

    expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
    expect(sink.record).not.toHaveBeenCalled();
  });

  // A blank subject is a missing one: honouring it would give every malformed token the same
  // empty identity, so audit entries and owner checks would conflate unrelated sessions.
  it.each(['', '   '])(
    'generates a fresh uuid identity when the sub claim is blank (%p)',
    (sub) => {
      const token = buildAccessToken({ sub, email: buildEmail(), roles: [ROLES.member] });

      const first = requireSnapshot({ token }).principal.id;
      const second = requireSnapshot({ token }).principal.id;

      expect(first).toMatch(UUID_PATTERN);
      expect(second).toMatch(UUID_PATTERN);
      expect(first).not.toBe(second);
    }
  );

  it('keeps a sub claim that is padded but real, trimmed to its identity', () => {
    const id = buildUserId();
    const token = buildAccessToken({ sub: `  ${id}  `, roles: [ROLES.member] });

    expect(requireSnapshot({ token }).principal.id).toBe(id);
  });

  it('generates a fresh uuid identity when the sub claim is missing', () => {
    const token = buildAccessToken({ email: buildEmail(), roles: [ROLES.member] });

    const first = requireSnapshot({ token }).principal.id;
    const second = requireSnapshot({ token }).principal.id;

    expect(first).toMatch(UUID_PATTERN);
    expect(second).toMatch(UUID_PATTERN);
    expect(first).not.toBe(second);
  });

  it('falls back to the input email when the email claim is missing', () => {
    const email = buildEmail();
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    expect(requireSnapshot({ token, email }).principal.email).toBe(email);
  });

  it('falls back to an empty email when neither the claim nor the input carries one', () => {
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    expect(requireSnapshot({ token }).principal.email).toBe('');
  });

  it('prefers the claimed email over the input email', () => {
    const claims = buildClaims();
    const token = buildAccessToken(claims);

    expect(requireSnapshot({ token, email: buildEmail() }).principal.email).toBe(claims.email);
  });

  it('falls back to the default tenant when the tenantId claim is missing', () => {
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(principal.tenants).toStrictEqual([{ id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID }]);
  });

  it('names the synthesised fallback tenant after the fallback id itself', async () => {
    const { SessionFactory: IsolatedSessionFactory } = await loadSessionFactory();
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    const { principal } = requireBuilt(new IsolatedSessionFactory().build({ token }));

    expect(principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(principal.tenants).toStrictEqual([{ id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID }]);
  });

  it('synthesises the membership list from a lone tenantId claim', () => {
    const tenant = buildTenantRef();
    const token = buildAccessToken({ sub: buildUserId(), tenantId: tenant.id });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(tenant.id);
    expect(principal.tenants).toStrictEqual([{ id: tenant.id, name: tenant.id }]);
  });

  it('activates the first claimed tenant when the token names no active tenant', () => {
    const first = buildTenantRef();
    const tenants = [first, buildTenantRef()];
    const token = buildAccessToken({ sub: buildUserId(), tenants });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(first.id);
    expect(principal.tenants).toStrictEqual(tenants);
  });

  // A claimed active tenant outside the membership list would scope the session to a
  // tenant the principal cannot read, so it is ignored in favour of a real membership.
  it('ignores a claimed active tenant the principal does not belong to', () => {
    const first = buildTenantRef();
    const tenants = [first, buildTenantRef()];
    const stranger = buildTenantRef();
    const token = buildAccessToken({ sub: buildUserId(), tenantId: stranger.id, tenants });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(first.id);
    expect(principal.tenants).toStrictEqual(tenants);
  });

  it('honours a claimed active tenant that is one of the claimed memberships', () => {
    const second = buildTenantRef();
    const tenants = [buildTenantRef(), second];
    const token = buildAccessToken({ sub: buildUserId(), tenantId: second.id, tenants });

    expect(requireSnapshot({ token }).principal.tenantId).toBe(second.id);
  });

  it('keeps only the known feature flags claimed by the token', () => {
    const token = buildAccessToken({
      sub: buildUserId(),
      flags: {
        [FEATURE_FLAGS.contactsModule]: true,
        [FEATURE_FLAGS.dealsModule]: false,
        [UNKNOWN_FLAG]: true,
      },
    });

    expect(requireSnapshot({ token }).flags).toStrictEqual({
      [FEATURE_FLAGS.contactsModule]: true,
      [FEATURE_FLAGS.dealsModule]: false,
    });
  });

  it('builds an anonymous principal when the payload carries no claim record', () => {
    const email = buildEmail();
    const token = `${encodeSegment({ alg: 'none' })}.${encodeSegment('not-a-record')}.signature`;

    expect(requireSnapshot({ token, email })).toStrictEqual({
      principal: {
        id: expect.stringMatching(UUID_PATTERN),
        email,
        roles: [DEFAULT_ROLE],
        permissions: permissionResolver.expand([DEFAULT_ROLE]),
        tenantId: FALLBACK_TENANT_ID,
        tenants: [{ id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID }],
      },
      flags: {},
    });
  });
});
