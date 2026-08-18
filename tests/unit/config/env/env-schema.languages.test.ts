/**
 * The schema is a module-level value built at import time, so each test imports it fresh to
 * keep the enum declarations themselves under test.
 */
describe('EnvSchema language enums', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it.each(['uk', 'en'])('accepts %s as the main language', async (language) => {
    const { default: EnvSchema } = await import('@/config/env/env-schema');

    expect(EnvSchema.parse({ mainLanguage: language }).mainLanguage).toBe(language);
  });

  it.each(['uk', 'en'])('accepts %s as the fallback language', async (language) => {
    const { default: EnvSchema } = await import('@/config/env/env-schema');

    expect(EnvSchema.parse({ fallbackLanguage: language }).fallbackLanguage).toBe(language);
  });

  it('accepts both language settings together', async () => {
    const { default: EnvSchema } = await import('@/config/env/env-schema');

    expect(EnvSchema.parse({ mainLanguage: 'uk', fallbackLanguage: 'en' })).toEqual({
      mainLanguage: 'uk',
      fallbackLanguage: 'en',
    });
  });

  it.each(['zz', 'ru', 'EN', ''])('rejects %p as a language', async (language) => {
    const { default: EnvSchema } = await import('@/config/env/env-schema');

    expect(() => EnvSchema.parse({ mainLanguage: language })).toThrow();
    expect(() => EnvSchema.parse({ fallbackLanguage: language })).toThrow();
  });
});
