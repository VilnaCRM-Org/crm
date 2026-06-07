import type AuthStoreActions from '@auth/stores/auth-store-actions';

const makeActions = (): AuthStoreActions =>
  ({ login: jest.fn(), register: jest.fn() }) as unknown as AuthStoreActions;

describe('AuthStoreFactory integration coverage', () => {
  it('skips devtools middleware in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    const devtoolsMock = jest.fn((stateCreator: unknown) => stateCreator);
    process.env.NODE_ENV = 'production';

    try {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('zustand/middleware', () => ({ devtools: devtoolsMock }));
        const { default: Factory } = await import('@auth/stores/auth-store-factory');

        Factory.create(makeActions());
      });

      expect(devtoolsMock).not.toHaveBeenCalled();
    } finally {
      jest.dontMock('zustand/middleware');
      if (originalEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalEnv;
      }
    }
  });
});
