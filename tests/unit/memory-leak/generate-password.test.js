const generatePassword = require('../../memory-leak/utils/generate-password');

describe('memlab generatePassword', () => {
  it.each([8, 12, 64])('builds a %i-character password the shared policy accepts', (length) => {
    const password = generatePassword(length);

    expect(password).toHaveLength(length);
    expect(password).toMatch(/^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]+$/u);
  });

  it('defaults to twelve characters', () => {
    expect(generatePassword()).toHaveLength(12);
  });

  it('never goes below its three required characters', () => {
    expect(generatePassword(1)).toHaveLength(3);
  });
});
