// @jest-environment @stryker-mutator/jest-runner/jest-env/node

describe('sign-up form-section loader rejection', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('@auth/routes/sign-up/sign-up-form-section');
  });

  it('preserves import rejection for the lazy loader', async () => {
    const error = new Error('form chunk failed');
    jest.doMock('@auth/routes/sign-up/sign-up-form-section', () => {
      throw error;
    });

    const { default: formSectionLoader } = await import('@auth/routes/sign-up/form-section-loader');

    await expect(formSectionLoader.load()).rejects.toBe(error);
  });
});
