import '../../../setup';

describe('Repository Metadata Fallback Coverage', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('@/modules/user/features/auth/repositories/user/sources/user.remote');
    jest.dontMock('@apollo/client');
  });

  it('loads repository classes when metadata param types are non-functions', () => {
    jest.isolateModules(() => {
      jest.doMock('@/modules/user/features/auth/repositories/user/sources/user.remote', () => ({
        __esModule: true,
        default: {},
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const UserRepository =
        require('@/modules/user/features/auth/repositories/user/user-repository').default;
      expect(UserRepository).toBeDefined();
    });

    jest.dontMock('@/modules/user/features/auth/repositories/user/sources/user.remote');
    jest.resetModules();

    jest.isolateModules(() => {
      jest.doMock('@apollo/client', () => {
        const actual = jest.requireActual('@apollo/client');
        return {
          ...actual,
          ApolloClient: {},
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const UserRemoteSource = require('@/modules/user/features/auth/repositories/user/sources/user.remote').default;
      expect(UserRemoteSource).toBeDefined();
    });
  });
});
