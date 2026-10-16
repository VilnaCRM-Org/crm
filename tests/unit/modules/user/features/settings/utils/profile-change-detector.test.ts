import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import { buildProfileFormValues, buildUserEntity } from '@tests/builders';

const detector = new ProfileChangeDetector();

const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'Olena.Petrenko@Example.com' });

const unchanged = (overrides = {}): ReturnType<typeof buildProfileFormValues> =>
  buildProfileFormValues({
    fullName: user.fullName,
    email: user.email,
    newPassword: '',
    ...overrides,
  });

describe('ProfileChangeDetector.detect', () => {
  it('returns null when only the current password is filled in', () => {
    expect(detector.detect(user, unchanged({ currentPassword: 'Current1' }))).toBeNull();
  });

  it.each([
    ['surrounding spaces on the name', { fullName: `  ${user.fullName}  ` }],
    ['a different e-mail case', { email: user.email.toLowerCase() }],
    ['an upper-cased e-mail', { email: user.email.toUpperCase() }],
    ['surrounding spaces on the e-mail', { email: `  ${user.email}  ` }],
  ])('treats %s as no change', (_name, overrides) => {
    expect(detector.detect(user, unchanged(overrides))).toBeNull();
  });

  it('compares against a profile whose own values carry spaces and a different case', () => {
    const padded = buildUserEntity({ fullName: '  Олена  ', email: '  A@B.CO ' });

    expect(detector.detect(padded, unchanged({ fullName: 'Олена', email: 'a@b.co' }))).toBeNull();
  });

  it('sends only the trimmed name for a name change', () => {
    const values = unchanged({ fullName: '  Ірина Коваль  ', currentPassword: ' Current1 ' });

    const change = detector.detect(user, values);

    expect(change).toEqual({
      id: user.id,
      currentPassword: ' Current1 ',
      fullName: 'Ірина Коваль',
    });
    expect(Object.keys(change ?? {}).sort()).toEqual(['currentPassword', 'fullName', 'id']);
  });

  it('sends only the trimmed e-mail in the typed case for an e-mail change', () => {
    const change = detector.detect(user, unchanged({ email: '  New.Person@Example.com ' }));

    expect(change).toEqual({
      id: user.id,
      currentPassword: expect.any(String),
      email: 'New.Person@Example.com',
    });
    expect(Object.keys(change ?? {}).sort()).toEqual(['currentPassword', 'email', 'id']);
  });

  it('sends a non-empty new password exactly as typed, spaces included', () => {
    const change = detector.detect(user, unchanged({ newPassword: ' Next12345 ' }));

    expect(change).toMatchObject({ id: user.id, newPassword: ' Next12345 ' });
    expect(Object.keys(change ?? {}).sort()).toEqual(['currentPassword', 'id', 'newPassword']);
  });

  it('sends all three aspects with the entity IRI unchanged', () => {
    const change = detector.detect(
      user,
      unchanged({ fullName: 'Нове Імʼя', email: 'new@example.com', newPassword: 'Next12345' })
    );

    expect(Object.keys(change ?? {}).sort()).toEqual([
      'currentPassword',
      'email',
      'fullName',
      'id',
      'newPassword',
    ]);
    expect(change?.id).toBe(user.id);
  });

  it('never carries an undefined value', () => {
    const change = detector.detect(user, unchanged({ fullName: 'Нове Імʼя' }));

    expect(Object.values(change ?? {})).not.toContain(undefined);
  });
});

describe('ProfileChangeDetector.nameChanged and emailChanged', () => {
  it.each([
    ['Олена Петренко', false],
    ['  Олена Петренко ', false],
    ['Олена', true],
    ['', true],
  ])('reports nameChanged for "%s" as %s', (name, expected) => {
    expect(detector.nameChanged(user, name)).toBe(expected);
  });

  it.each([
    ['olena.petrenko@example.com', false],
    ['  OLENA.PETRENKO@EXAMPLE.COM ', false],
    ['other@example.com', true],
    ['', true],
  ])('reports emailChanged for "%s" as %s', (email, expected) => {
    expect(detector.emailChanged(user, email)).toBe(expected);
  });

  it('lower-cases the profile e-mail too', () => {
    const mixed = buildUserEntity({ email: 'MiXeD@Case.COM' });

    expect(detector.emailChanged(mixed, 'mixed@case.com')).toBe(false);
  });
});
