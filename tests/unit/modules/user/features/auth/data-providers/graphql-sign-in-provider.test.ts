import 'reflect-metadata';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import GraphQLSignInProvider from '@auth/data-providers/graphql-sign-in-provider';
import type { GraphQLSignInRepository } from '@auth/repositories';
import GraphQLSignInTransformer from '@auth/transformers/graphql-sign-in-transformer';
import type { TwoFactorChallengeInput } from '@auth/types/two-factor/challenge';
import { buildEmail, buildPassword, buildPendingSessionId, buildToken } from '@tests/builders';

const setUp = (): {
  provider: GraphQLSignInProvider;
  signIn: jest.Mock;
  transformer: GraphQLSignInTransformer;
  errors: UserServiceErrorTransformer;
} => {
  const signIn = jest.fn();
  const repository = { signIn } as unknown as GraphQLSignInRepository;
  const transformer = new GraphQLSignInTransformer();
  const errors = new UserServiceErrorTransformer();
  return {
    provider: new GraphQLSignInProvider(repository, transformer, errors),
    signIn,
    transformer,
    errors,
  };
};

const dto = (): { email: string; password: string } => ({
  email: buildEmail(),
  password: buildPassword(),
});

describe('GraphQLSignInProvider.login', () => {
  it('hands the payload and dto to toSignInResult and returns its result', async () => {
    const { provider, signIn, transformer } = setUp();
    const input = dto();
    const payload = {
      signInUser: {
        user: {
          success: true,
          twoFactorEnabled: false,
          accessToken: buildToken(),
          pendingSessionId: null,
        },
      },
    };
    signIn.mockResolvedValue(payload);
    const toResult = jest.spyOn(transformer, 'toSignInResult');
    const { signal } = new AbortController();

    const result = await provider.login(input, signal);

    expect(signIn).toHaveBeenCalledWith(input, signal);
    expect(toResult).toHaveBeenCalledWith(payload, input);
    expect(result).toBe(toResult.mock.results[0]?.value);
    expect(result).toMatchObject({ ok: true, value: { kind: 'session' } });
  });

  it('returns a challenge for a pending-session payload', async () => {
    const { provider, signIn } = setUp();
    const pendingSessionId = buildPendingSessionId();
    signIn.mockResolvedValue({
      signInUser: {
        user: { success: true, twoFactorEnabled: true, accessToken: null, pendingSessionId },
      },
    });

    await expect(provider.login(dto(), new AbortController().signal)).resolves.toMatchObject({
      ok: true,
      value: { kind: 'challenge', pendingSessionId },
    });
  });

  it('normalises a thrown error with the signal and maps it through toSignInFailure', async () => {
    const { provider, signIn, transformer, errors } = setUp();
    const failure = new Error('network down');
    signIn.mockRejectedValue(failure);
    const normalize = jest.spyOn(errors, 'normalize');
    const toFailure = jest.spyOn(transformer, 'toSignInFailure');
    const { signal } = new AbortController();

    const result = await provider.login(dto(), signal);

    expect(normalize).toHaveBeenCalledWith(failure, signal);
    expect(toFailure).toHaveBeenCalledWith(normalize.mock.results[0]?.value);
    expect(result).toBe(toFailure.mock.results[0]?.value);
    expect(result).toMatchObject({ ok: false, error: { reason: 'transient' } });
  });

  it('maps an aborted signal to the aborted AuthError', async () => {
    const { provider, signIn } = setUp();
    signIn.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const controller = new AbortController();
    controller.abort();

    await expect(provider.login(dto(), controller.signal)).resolves.toEqual({
      ok: false,
      error: { kind: 'network', displayMessage: '', retryable: false, aborted: true },
    });
  });

  it('takes exactly three collaborators and has two public methods', () => {
    expect(GraphQLSignInProvider.length).toBe(3);
    expect(
      Object.getOwnPropertyNames(GraphQLSignInProvider.prototype).filter((n) => n !== 'constructor')
    ).toEqual(['login', 'completeChallenge']);
  });
});

describe('GraphQLSignInProvider.completeChallenge', () => {
  const challenge = (): TwoFactorChallengeInput => ({
    pendingSessionId: buildPendingSessionId(),
    twoFactorCode: '123456',
  });

  const setUpChallenge = (): ReturnType<typeof setUp> & { complete: jest.Mock } => {
    const complete = jest.fn();
    const repository = { completeChallenge: complete } as unknown as GraphQLSignInRepository;
    const transformer = new GraphQLSignInTransformer();
    const errors = new UserServiceErrorTransformer();
    return {
      provider: new GraphQLSignInProvider(repository, transformer, errors),
      signIn: jest.fn(),
      complete,
      transformer,
      errors,
    };
  };

  it('hands the payload to toChallengeResult and returns its result', async () => {
    const { provider, complete, transformer } = setUpChallenge();
    const input = challenge();
    const token = buildToken();
    const payload = {
      completeTwoFactorUser: {
        user: { twoFactorEnabled: true, accessToken: token, recoveryCodesRemaining: 1 },
      },
    };
    complete.mockResolvedValue(payload);
    const toResult = jest.spyOn(transformer, 'toChallengeResult');
    const { signal } = new AbortController();

    const result = await provider.completeChallenge(input, signal);

    expect(complete).toHaveBeenCalledWith(input, signal);
    expect(toResult).toHaveBeenCalledWith(payload);
    expect(result).toBe(toResult.mock.results[0]?.value);
    expect(result).toEqual({ kind: 'completed', token, recoveryCodesRemaining: 1 });
  });

  it('normalises a thrown error with the signal and maps it via toChallengeFailure', async () => {
    const { provider, complete, transformer, errors } = setUpChallenge();
    const thrown = new Error('network down');
    complete.mockRejectedValue(thrown);
    const normalize = jest.spyOn(errors, 'normalize');
    const toFailure = jest.spyOn(transformer, 'toChallengeFailure');
    const { signal } = new AbortController();

    const result = await provider.completeChallenge(challenge(), signal);

    expect(normalize).toHaveBeenCalledWith(thrown, signal);
    expect(toFailure).toHaveBeenCalledWith(normalize.mock.results[0]?.value);
    expect(result).toBe(toFailure.mock.results[0]?.value);
  });

  it('gives a network outcome for an aborted signal', async () => {
    const { provider, complete } = setUpChallenge();
    complete.mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const controller = new AbortController();
    controller.abort();

    await expect(provider.completeChallenge(challenge(), controller.signal)).resolves.toEqual({
      kind: 'failed',
      reason: 'network',
    });
  });
});
