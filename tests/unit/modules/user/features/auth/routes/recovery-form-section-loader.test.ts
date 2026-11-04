// @jest-environment @stryker-mutator/jest-runner/jest-env/node

interface FormSectionLoader {
  load(): Promise<{ default: unknown }>;
}

interface RecoveryLoaderCase {
  readonly name: 'reset-password' | 'create-new-password';
  readonly section: string;
  readonly importLoader: () => Promise<{ default: FormSectionLoader }>;
}

const recoveryLoaderCases: readonly RecoveryLoaderCase[] = [
  {
    name: 'reset-password',
    section: '@auth/routes/reset-password/reset-password-form-section',
    importLoader: async () => import('@auth/routes/reset-password/form-section-loader'),
  },
  {
    name: 'create-new-password',
    section: '@auth/routes/create-new-password/create-new-password-form-section',
    importLoader: async () => import('@auth/routes/create-new-password/form-section-loader'),
  },
];

describe('password-recovery form-section loaders', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    for (const { section } of recoveryLoaderCases) {
      jest.dontMock(section);
    }
  });

  it.each(recoveryLoaderCases)(
    '$name load() resolves its form-section module',
    async (loaderCase) => {
      const FormSection = (): null => null;
      jest.doMock(loaderCase.section, () => ({ __esModule: true, default: FormSection }));

      const { default: loader } = await loaderCase.importLoader();

      await expect(loader.load()).resolves.toMatchObject({ default: FormSection });
    }
  );

  it.each(recoveryLoaderCases)(
    '$name load() keeps a failed import rejected',
    async (loaderCase) => {
      const error = new Error(`${loaderCase.name} form chunk failed`);
      jest.doMock(loaderCase.section, () => {
        throw error;
      });

      const { default: loader } = await loaderCase.importLoader();

      await expect(loader.load()).rejects.toBe(error);
    }
  );
});
