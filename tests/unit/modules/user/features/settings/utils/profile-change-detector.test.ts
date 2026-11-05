import ProfileChangeDetector from '@/modules/user/features/settings/utils/profile-change-detector';
import {
  buildEmail,
  buildFullName,
  buildPassword,
  buildProfileFormValues,
  buildUserEntity,
} from '@tests/builders';

const NEW_FULL_NAME = buildFullName();
const NEW_EMAIL = buildEmail();
const NEW_PASSWORD = buildPassword();

const detector = new ProfileChangeDetector();

const user = buildUserEntity({ fullName: 'Олена Петренко', email: 'Olena.Petrenko@Example.com' });

const unchanged = (overrides = {}): ReturnType<typeof buildProfileFormValues> =>
  buildProfileFormValues({
    fullName: user.fullName,
    email: user.email,
    fullNamePassword: '',
    emailPassword: '',
    currentPassword: '',
    newPassword: '',
    ...overrides,
  });

describe('ProfileChangeDetector.detect', () => {
  it.each(['fullName', 'email', 'password'] as const)(
    'returns null for the %s section when only a password is filled in',
    (section) => {
      const values = unchanged({
        fullNamePassword: 'Current1',
        emailPassword: 'Current1',
        currentPassword: 'Current1',
      });

      expect(detector.detect(section, user, values)).toBeNull();
    }
  );

  it.each([
    ['surrounding spaces on the name', 'fullName', { fullName: `  ${user.fullName}  ` }],
    ['a different e-mail case', 'email', { email: user.email.toLowerCase() }],
    ['an upper-cased e-mail', 'email', { email: user.email.toUpperCase() }],
    ['surrounding spaces on the e-mail', 'email', { email: `  ${user.email}  ` }],
  ] as const)('treats %s as no change', (_name, section, overrides) => {
    expect(detector.detect(section, user, unchanged(overrides))).toBeNull();
  });

  it('compares against a profile whose own values carry spaces and a different case', () => {
    const padded = buildUserEntity({ fullName: '  Олена  ', email: '  A@B.CO ' });
    const values = unchanged({ fullName: 'Олена', email: 'a@b.co' });

    expect(detector.detect('fullName', padded, values)).toBeNull();
    expect(detector.detect('email', padded, values)).toBeNull();
  });

  it('sends only the trimmed name and its own password for a name change', () => {
    const values = unchanged({
      fullName: '  Ірина Коваль  ',
      fullNamePassword: ' Current1 ',
      emailPassword: 'other',
      currentPassword: 'another',
    });

    expect(detector.detect('fullName', user, values)).toStrictEqual({
      id: user.id,
      currentPassword: ' Current1 ',
      fullName: 'Ірина Коваль',
    });
  });

  it('sends only the trimmed e-mail in the typed case and its own password', () => {
    const values = unchanged({
      email: '  New.Person@Example.com ',
      emailPassword: 'Current1',
      fullNamePassword: 'other',
      currentPassword: 'another',
    });

    expect(detector.detect('email', user, values)).toStrictEqual({
      id: user.id,
      currentPassword: 'Current1',
      email: 'New.Person@Example.com',
    });
  });

  it.each([' ', '   ', '\t'])('treats a whitespace-only new password %j as no change', (pw) => {
    expect(detector.detect('password', user, unchanged({ newPassword: pw }))).toBeNull();
    expect(detector.passwordChanged(pw)).toBe(false);
  });

  it('counts any non-space character in the new password as a change', () => {
    expect(detector.passwordChanged(' a ')).toBe(true);
    expect(detector.passwordChanged('')).toBe(false);
  });

  it('sends a non-empty new password exactly as typed, spaces included', () => {
    const values = unchanged({ newPassword: ' Next12345 ', currentPassword: 'Current1' });

    expect(detector.detect('password', user, values)).toStrictEqual({
      id: user.id,
      currentPassword: 'Current1',
      newPassword: ' Next12345 ',
    });
  });

  it('keeps a section to itself when the other sections hold edits too', () => {
    const values = unchanged({
      fullName: NEW_FULL_NAME,
      email: NEW_EMAIL,
      newPassword: NEW_PASSWORD,
    });

    expect(Object.keys(detector.detect('fullName', user, values) ?? {}).sort()).toEqual([
      'currentPassword',
      'fullName',
      'id',
    ]);
    expect(Object.keys(detector.detect('email', user, values) ?? {}).sort()).toEqual([
      'currentPassword',
      'email',
      'id',
    ]);
    expect(Object.keys(detector.detect('password', user, values) ?? {}).sort()).toEqual([
      'currentPassword',
      'id',
      'newPassword',
    ]);
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
