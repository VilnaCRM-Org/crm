// @jest-environment @stryker-mutator/jest-runner/jest-env/node

describe('two-factor form-section loader', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('@auth/routes/two-factor/two-factor-form-section');
  });

  it('load() resolves the form-section module', async () => {
    const FormSection = (): null => null;
    jest.doMock('@auth/routes/two-factor/two-factor-form-section', () => ({
      __esModule: true,
      default: FormSection,
    }));

    const { default: loader } = await import('@auth/routes/two-factor/form-section-loader');

    await expect(loader.load()).resolves.toMatchObject({ default: FormSection });
  });

  it('load() keeps a failed import rejected', async () => {
    jest.doMock('@auth/routes/two-factor/two-factor-form-section', () => {
      throw new Error('chunk failed');
    });

    const { default: loader } = await import('@auth/routes/two-factor/form-section-loader');

    await expect(loader.load()).rejects.toThrow('chunk failed');
  });
});
