import server, { userServiceGraphql } from './server';

export interface AnsweredSignIn {
  readonly variables: Readonly<Record<string, unknown>>;
  readonly authorization: string | null;
}

export const answerSignIn = (respond: () => Response): AnsweredSignIn[] => {
  const answered: AnsweredSignIn[] = [];
  server.use(
    userServiceGraphql.mutation('SignInUser', ({ variables, request }) => {
      answered.push({ variables, authorization: request.headers.get('authorization') });
      return respond();
    })
  );
  return answered;
};

export const answerChallenge = (respond: () => Response): AnsweredSignIn[] => {
  const answered: AnsweredSignIn[] = [];
  server.use(
    userServiceGraphql.mutation('CompleteTwoFactorUser', ({ variables, request }) => {
      answered.push({ variables, authorization: request.headers.get('authorization') });
      return respond();
    })
  );
  return answered;
};
