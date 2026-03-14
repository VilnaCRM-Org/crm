import { useMutation } from '@apollo/client';

import useCreateUser, {
  buildCreateUserInput,
  CREATE_USER_TIMEOUT_MS,
} from '@/modules/user/features/auth/hooks/use-create-user';
import { CREATE_USER } from '@/modules/user/features/auth/types/graphql';

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useMutation with CREATE_USER', () => {
    (useMutation as jest.Mock).mockReturnValue([jest.fn(), {}]);

    useCreateUser();

    expect(useMutation).toHaveBeenCalledWith(CREATE_USER);
  });

  it('adds timeout AbortSignal when no request signal is provided', () => {
    jest.useFakeTimers();

    const pendingMutation = new Promise(() => {});
    const mutateMock = jest.fn().mockReturnValue(pendingMutation);
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();

    createUser({
      variables: {
        input: {
          email: 'jane@example.com',
          initials: 'Jane Doe',
          password: 'Secret123',
          clientMutationId: 'test-client-mutation-id',
        },
      },
    });

    const mutationOptions = mutateMock.mock.calls[0][0];
    const signal = mutationOptions.context.fetchOptions.signal as AbortSignal;

    expect(signal.aborted).toBe(false);

    jest.advanceTimersByTime(CREATE_USER_TIMEOUT_MS);

    expect(signal.aborted).toBe(true);
    jest.useRealTimers();
  });

  it('supports calling mutation without options and still injects signal', () => {
    jest.useFakeTimers();

    const pendingMutation = new Promise(() => {});
    const mutateMock = jest.fn().mockReturnValue(pendingMutation);
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();

    createUser();

    const mutationOptions = mutateMock.mock.calls[0][0];

    expect(mutationOptions.context.fetchOptions.signal).toBeDefined();
    jest.useRealTimers();
  });

  it('preserves a caller-provided request signal', async () => {
    const mutateMock = jest.fn().mockResolvedValue({});
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();
    const controller = new AbortController();

    await createUser({
      variables: {
        input: {
          email: 'jane@example.com',
          initials: 'Jane Doe',
          password: 'Secret123',
          clientMutationId: 'test-client-mutation-id',
        },
      },
      context: {
        fetchOptions: {
          signal: controller.signal,
        },
      },
    });

    const mutationOptions = mutateMock.mock.calls[0][0];

    expect(mutationOptions.context.fetchOptions.signal).toBe(controller.signal);
  });

  it('merges timeout signal into existing context without fetchOptions', async () => {
    const mutateMock = jest.fn().mockResolvedValue({});
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();

    await createUser({
      variables: {
        input: {
          email: 'jane@example.com',
          initials: 'Jane Doe',
          password: 'Secret123',
          clientMutationId: 'test-client-mutation-id',
        },
      },
      context: {
        operationName: 'CreateUser',
      },
    });

    const mutationOptions = mutateMock.mock.calls[0][0];

    expect(mutationOptions.context.operationName).toBe('CreateUser');
    expect(mutationOptions.context.fetchOptions.signal).toBeDefined();
  });

  it('preserves existing fetchOptions when adding timeout signal', async () => {
    const mutateMock = jest.fn().mockResolvedValue({});
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();

    await createUser({
      variables: {
        input: {
          email: 'jane@example.com',
          initials: 'Jane Doe',
          password: 'Secret123',
          clientMutationId: 'test-client-mutation-id',
        },
      },
      context: {
        fetchOptions: {
          mode: 'cors',
        },
      },
    });

    const mutationOptions = mutateMock.mock.calls[0][0];

    expect(mutationOptions.context.fetchOptions.mode).toBe('cors');
    expect(mutationOptions.context.fetchOptions.signal).toBeDefined();
  });

  it('clears timeout after mutation settles', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const mutateMock = jest.fn().mockResolvedValue({});
    (useMutation as jest.Mock).mockReturnValue([mutateMock, {}]);

    const [createUser] = useCreateUser();

    await createUser({
      variables: {
        input: {
          email: 'jane@example.com',
          initials: 'Jane Doe',
          password: 'Secret123',
          clientMutationId: 'test-client-mutation-id',
        },
      },
    });

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});
