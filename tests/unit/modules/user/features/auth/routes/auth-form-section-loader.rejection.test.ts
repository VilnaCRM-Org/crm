// @jest-environment @stryker-mutator/jest-runner/jest-env/node

interface FormSectionLoader {
  load(): Promise<unknown>;
}

interface FormSectionLoaderCase {
  readonly clearFormSectionMock: () => void;
  readonly loadFormSectionLoader: () => Promise<{ default: FormSectionLoader }>;
  readonly mockFormSection: (error: Error) => void;
  readonly name: 'sign-in' | 'sign-up';
}

const formSectionLoaderCases: readonly FormSectionLoaderCase[] = [
  {
    clearFormSectionMock: (): void => {
      jest.dontMock('@auth/routes/sign-up/sign-up-form-section');
    },
    loadFormSectionLoader: async () => import('@auth/routes/sign-up/form-section-loader'),
    mockFormSection: (error: Error): void => {
      jest.doMock('@auth/routes/sign-up/sign-up-form-section', () => {
        throw error;
      });
    },
    name: 'sign-up',
  },
  {
    clearFormSectionMock: (): void => {
      jest.dontMock('@auth/routes/sign-in/sign-in-form-section');
    },
    loadFormSectionLoader: async () => import('@auth/routes/sign-in/form-section-loader'),
    mockFormSection: (error: Error): void => {
      jest.doMock('@auth/routes/sign-in/sign-in-form-section', () => {
        throw error;
      });
    },
    name: 'sign-in',
  },
];

describe('auth form-section loader rejection', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    for (const { clearFormSectionMock } of formSectionLoaderCases) {
      clearFormSectionMock();
    }
  });

  for (const { loadFormSectionLoader, mockFormSection, name } of formSectionLoaderCases) {
    it(`preserves ${name} form import rejection for the lazy loader`, async () => {
      const error = new Error('form chunk failed');
      mockFormSection(error);

      const module = await loadFormSectionLoader();

      await expect(module.default.load()).rejects.toBe(error);
    });
  }
});
