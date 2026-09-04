import claimsMapper, { ClaimsMapper } from '@/lib/access/claims-mapper';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { ROLES } from '@/lib/access/permission-catalog';
import { buildClaims, buildEmail, buildTenantRef, buildUserId } from '@tests/builders';

const EMPTY_CLAIMS = {
  sub: undefined,
  email: undefined,
  roles: undefined,
  tenantId: undefined,
  tenants: undefined,
  flags: undefined,
};

describe('ClaimsMapper', () => {
  const mapper = new ClaimsMapper();

  it('exports a shared singleton instance', () => {
    expect(claimsMapper).toBeInstanceOf(ClaimsMapper);
  });

  it.each([
    { label: 'null', raw: null },
    { label: 'undefined', raw: undefined },
    { label: 'an array of claim records', raw: [buildClaims()] },
    { label: 'an empty array', raw: [] },
    { label: 'a string', raw: buildUserId() },
    { label: 'a number', raw: 42 },
    { label: 'a boolean', raw: true },
  ])('returns null when the payload is $label', ({ raw }) => {
    expect(mapper.map(raw)).toBeNull();
  });

  it('maps every claim of a well-formed payload', () => {
    const tenant = buildTenantRef();
    const claims = buildClaims({
      roles: [ROLES.manager, ROLES.viewer],
      tenantId: tenant.id,
      tenants: [tenant],
      flags: { [FEATURE_FLAGS.contactsModule]: true },
    });

    expect(mapper.map({ ...claims })).toStrictEqual({ ...claims });
  });

  it('returns an all-undefined shape for an empty record', () => {
    expect(mapper.map({})).toStrictEqual(EMPTY_CLAIMS);
  });

  it('drops sub, email and tenantId claims that are not strings', () => {
    const tenant = buildTenantRef();

    expect(mapper.map({ sub: 7, email: null, tenantId: [tenant.id] })).toStrictEqual(EMPTY_CLAIMS);
  });

  it('keeps the string claims that sit beside dropped non-string ones', () => {
    const sub = buildUserId();
    const tenant = buildTenantRef();

    expect(mapper.map({ sub, email: 42, tenantId: tenant.id })).toStrictEqual({
      ...EMPTY_CLAIMS,
      sub,
      tenantId: tenant.id,
    });
  });

  it('drops a roles claim that is not an array', () => {
    expect(mapper.map({ roles: ROLES.admin })).toStrictEqual(EMPTY_CLAIMS);
  });

  it('keeps only the string entries of a mixed roles claim', () => {
    const raw = { roles: [ROLES.admin, 7, null, ROLES.viewer, { role: ROLES.manager }] };

    expect(mapper.map(raw)).toStrictEqual({ ...EMPTY_CLAIMS, roles: [ROLES.admin, ROLES.viewer] });
  });

  it('maps an empty roles array to an empty list rather than undefined', () => {
    expect(mapper.map({ roles: [] })).toStrictEqual({ ...EMPTY_CLAIMS, roles: [] });
  });

  it('drops a tenants claim that is not an array', () => {
    const tenant = buildTenantRef();

    expect(mapper.map({ tenants: { [tenant.id]: tenant.name } })).toStrictEqual(EMPTY_CLAIMS);
  });

  it('keeps only tenant entries carrying a string id and a string name', () => {
    const tenant = buildTenantRef();
    const annotated = buildTenantRef();
    const raw = {
      tenants: [
        tenant,
        { ...annotated, region: 'eu' },
        [annotated.id, annotated.name],
        null,
        buildEmail(),
        { id: 7, name: annotated.name },
        { id: annotated.id },
        {},
      ],
    };

    expect(mapper.map(raw)).toStrictEqual({
      ...EMPTY_CLAIMS,
      tenants: [tenant, { id: annotated.id, name: annotated.name }],
    });
  });

  it.each([
    { label: 'a string', flags: FEATURE_FLAGS.contactsModule },
    { label: 'an array', flags: [FEATURE_FLAGS.contactsModule] },
    { label: 'null', flags: null },
    { label: 'a number', flags: 1 },
  ])('drops a flags claim that is $label', ({ flags }) => {
    expect(mapper.map({ flags })).toStrictEqual(EMPTY_CLAIMS);
  });

  it('keeps only the boolean-valued entries of a flags claim', () => {
    const raw = {
      flags: {
        [FEATURE_FLAGS.contactsModule]: true,
        [FEATURE_FLAGS.dealsModule]: false,
        [FEATURE_FLAGS.tenantSwitcher]: 'true',
        unknownNumericFlag: 1,
        unknownNullFlag: null,
      },
    };

    expect(mapper.map(raw)).toStrictEqual({
      ...EMPTY_CLAIMS,
      flags: { [FEATURE_FLAGS.contactsModule]: true, [FEATURE_FLAGS.dealsModule]: false },
    });
  });

  it('maps an empty flags record to an empty flag state', () => {
    expect(mapper.map({ flags: {} })).toStrictEqual({ ...EMPTY_CLAIMS, flags: {} });
  });
});
