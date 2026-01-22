import { useMutation } from '@apollo/client';

import { CREATE_USER } from '@/modules/User/features/Auth/api/graphql';
import useCreateUser, {
  buildCreateUserInput,
} from '@/modules/User/features/Auth/api/hooks/useCreateUser';

jest.mock('@apollo/client', () => ({
  useMutation: jest.fn(),
  gql: (literals: TemplateStringsArray): string => literals[0],
}));

describe('buildCreateUserInput', () => {
  it('should trim fullName and include password in GraphQL input payload', () => {
    const variables = {
      fullName: '  Jane Doe  ',
      email: 'jane@example.com',
      password: 'Secret123',
    };
    const input = buildCreateUserInput(variables);

    expect(input).toEqual(
      expect.objectContaining({
        email: 'jane@example.com',
        initials: 'Jane Doe',
        password: 'Secret123',
      })
    );
    expect(input.clientMutationId).toBeDefined();
  });
});

describe('useCreateUser', () => {
  it('should call useMutation with CREATE_USER', () => {
    (useMutation as jest.Mock).mockReturnValue([jest.fn(), {}]);

    useCreateUser();

    expect(useMutation).toHaveBeenCalledWith(CREATE_USER);
  });
});
