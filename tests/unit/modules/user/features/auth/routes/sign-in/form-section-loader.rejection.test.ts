// @jest-environment @stryker-mutator/jest-runner/jest-env/node

describe('sign-in form-section loader rejection', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('@auth/routes/sign-in/sign-in-form-section');
  });

  it('preserves import rejection for the lazy loader', async () => {
    const error = new Error('form chunk failed');
    jest.doMock('@auth/routes/sign-in/sign-in-form-section', () => {
      throw error;
    });

    const { default: formSectionLoader } = await import('@auth/routes/sign-in/form-section-loader');

    await expect(formSectionLoader.load()).rejects.toBe(error);
  });
});
