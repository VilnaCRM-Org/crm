import { delay } from 'msw';

import server, { userServiceGraphql } from './server';

export type ProfileOperation = 'CurrentUser' | 'UpdateUser' | 'ResendEmailToUser';

export interface AnsweredProfileRequest {
  readonly variables: Readonly<Record<string, unknown>>;
  readonly authorization: string | null;
}

export interface ProfileAnswer {
  readonly respond: () => Response;
  readonly delayMs?: number;
}

export const answerProfileOperation = (
  operation: ProfileOperation,
  answer: ProfileAnswer
): AnsweredProfileRequest[] => {
  const answered: AnsweredProfileRequest[] = [];
  const register =
    operation === 'CurrentUser' ? userServiceGraphql.query : userServiceGraphql.mutation;
  server.use(
    register(operation, async ({ variables, request }) => {
      answered.push({ variables, authorization: request.headers.get('authorization') });
      if (answer.delayMs) await delay(answer.delayMs);
      return answer.respond();
    })
  );
  return answered;
};
