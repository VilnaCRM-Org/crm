import 'reflect-metadata';

import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';

const mapper = new UserDisplayNameMapper();

describe('UserDisplayNameMapper', () => {
  it.each([
    ['Admin', 'Admin', 'A'],
    ['Олена Петренко', 'Олена Петренко', 'ОП'],
    ['Петренко Олена Іванівна', 'Олена Петренко', 'ОП'],
    ['Маслова Евгения Олеговна', 'Евгения Маслова', 'ЕМ'],
    ['Петренко Олена Іванівна Друга', 'Олена Петренко', 'ОП'],
    ['  Петренко\tОлена   Іванівна ', 'Олена Петренко', 'ОП'],
  ])('maps "%s" to the display name "%s" and the monogram "%s"', (full, name, letters) => {
    expect(mapper.fromFullName(full)).toEqual({ displayName: name, monogram: letters });
  });

  it('keeps extra whitespace of a one or two word name, but not in the monogram', () => {
    expect(mapper.fromFullName('  олена   петренко  ')).toEqual({
      displayName: '  олена   петренко  ',
      monogram: 'ОП',
    });
  });

  it('upper-cases a lower-case name', () => {
    expect(mapper.fromFullName('анна коваль').monogram).toBe('АК');
  });

  it('takes the first code point of an emoji and the first letter of the next word', () => {
    expect(mapper.fromFullName('😀 smile').monogram).toBe('😀S');
  });

  it('splits on tabs and hyphenated names count as one word', () => {
    expect(mapper.fromFullName('Анна-Марія\tКоваль').monogram).toBe('АК');
  });

  it.each(['', '   '])('gives an empty monogram for the empty name %j', (full) => {
    expect(mapper.fromFullName(full).monogram).toBe('');
  });

  it('keeps the empty name as the display name', () => {
    expect(mapper.fromFullName('').displayName).toBe('');
  });
});
