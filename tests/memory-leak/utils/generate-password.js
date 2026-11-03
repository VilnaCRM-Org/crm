const { faker } = require('@faker-js/faker');

function generatePassword(length = 12) {
  const uppercase = faker.string.alpha({ length: 1, casing: 'upper' });
  const lowercase = faker.string.alpha({ length: 1, casing: 'lower' });
  const digit = faker.string.numeric(1);
  const remainingLength = Math.max(length - 3, 0);
  const remaining = faker.string.alphanumeric(remainingLength);
  const characters = `${uppercase}${lowercase}${digit}${remaining}`.split('');

  for (let i = characters.length - 1; i > 0; i -= 1) {
    const randomIndex = faker.number.int({ min: 0, max: i });
    [characters[i], characters[randomIndex]] = [characters[randomIndex], characters[i]];
  }

  return characters.join('');
}

module.exports = generatePassword;
