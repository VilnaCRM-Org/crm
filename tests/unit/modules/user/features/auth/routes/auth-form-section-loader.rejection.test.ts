// @jest-environment @stryker-mutator/jest-runner/jest-env/node

interface FormSectionLoader {
  load(): Promise<unknown>;
}

interface FormSectionLoaderCase {
  readonly formSectionModule: string;
  readonly loaderModule: string;
  readonly name: 'sign-in' | 'sign-up';
}

const formSectionLoaderCases: readonly FormSectionLoaderCase[] = [
  {
    formSectionModule: '@auth/routes/sign-up/sign-up-form-section',
    loaderModule: '@auth/routes/sign-up/form-section-loader',
    name: 'sign-up',
  },
  {
    formSectionModule: '@auth/routes/sign-in/sign-in-form-section',
    loaderModule: '@auth/routes/sign-in/form-section-loader',
    name: 'sign-in',
  },
];

describe('auth form-section loader rejection', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    for (const { formSectionModule } of formSectionLoaderCases) {
      jest.dontMock(formSectionModule);
    }
  });

  for (const { formSectionModule, loaderModule, name } of formSectionLoaderCases) {
    it(`preserves ${name} form import rejection for the lazy loader`, async () => {
      const error = new Error('form chunk failed');
      jest.doMock(formSectionModule, () => {
        throw error;
      });

      const module: { default: FormSectionLoader } = await import(loaderModule);

      await expect(module.default.load()).rejects.toBe(error);
    });
  }
});
