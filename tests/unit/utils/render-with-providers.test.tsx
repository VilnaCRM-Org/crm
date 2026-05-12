import { waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
  createAuthClients,
  type AuthClients,
} from '@/modules/user/features/auth/repositories';
import { registerUser } from '@/modules/user/store/registration-slice';

import renderWithProviders from './render-with-providers';

const loginMock = jest.fn();
const registerMock = jest.fn();

jest.mock('@/modules/user/features/auth/repositories', () => ({
  __esModule: true,
  createAuthClients: jest.fn(),
}));

const mockedCreateAuthClients = createAuthClients as jest.MockedFunction<typeof createAuthClients>;

function DispatchRegisterUser(): JSX.Element {
  const dispatch = useDispatch();

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

    const authClients: AuthClients = {
      loginAPI: {
        login: loginMock as AuthClients['loginAPI']['login'],
      },
      registrationAPI: {
        register: registerMock as AuthClients['registrationAPI']['register'],
      },
    };

    mockedCreateAuthClients.mockReturnValue(authClients);
  });

  it('configures thunk extraArgument so auth thunks receive the registration API client', async () => {
    registerMock.mockResolvedValue({ email: 'ada@example.com', fullName: 'Ada Lovelace' });

    renderWithProviders(<DispatchRegisterUser />);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledTimes(1);
    });
  });
});
