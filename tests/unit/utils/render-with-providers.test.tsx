import { waitFor } from '@testing-library/react';
import { useEffect } from 'react';

import useAppDispatch from '@/stores/hooks';

import { type AuthClients } from '@/modules/user/features/auth/repositories';
import ApiErrorFactory from '@/modules/user/features/auth/repositories/api-error-factory';
import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';
import { registerUser } from '@/modules/user/store/registration-slice';
import type HttpsClient from '@/services/https-client/https-client';
import createAuthClients from '@/stores/auth-clients';

import renderWithProviders from './render-with-providers';

const loginMock = jest.fn<ReturnType<LoginAPI['login']>, Parameters<LoginAPI['login']>>();
const registerMock = jest.fn<
  ReturnType<RegistrationAPI['register']>,
  Parameters<RegistrationAPI['register']>
>();

jest.mock('@/stores/auth-clients', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedCreateAuthClients = createAuthClients as jest.MockedFunction<typeof createAuthClients>;
const registerThunkTestName = [
  'configures thunk extraArgument so auth thunks receive',
  'the registration API client',
].join(' ');

function makeHttpsClientMock(): HttpsClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
}

function createAuthClientsMock(): AuthClients {
  const apiErrorFactory = new ApiErrorFactory();
  const loginAPI = new LoginAPI(makeHttpsClientMock(), apiErrorFactory);
  const registrationAPI = new RegistrationAPI(makeHttpsClientMock(), apiErrorFactory);

  jest.spyOn(loginAPI, 'login').mockImplementation(loginMock);
  jest.spyOn(registrationAPI, 'register').mockImplementation(registerMock);

  return { loginAPI, registrationAPI };
}

function DispatchRegisterUser(): JSX.Element | null {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      registerUser({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Password1',
      })
    );
  }, [dispatch]);

  return null;
}

describe('renderWithProviders', () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
    mockedCreateAuthClients.mockReset();
    mockedCreateAuthClients.mockImplementation(createAuthClientsMock);
  });

  it(registerThunkTestName, async () => {
    registerMock.mockResolvedValue({ email: 'ada@example.com', fullName: 'Ada Lovelace' });

    renderWithProviders(<DispatchRegisterUser />);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledTimes(1);
    });
  });
});
