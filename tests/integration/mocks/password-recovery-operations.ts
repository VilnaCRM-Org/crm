import type { RecoveryStep } from '@auth/types/password-recovery/outcome';

import server, { userServiceGraphql } from './server';

export interface AnsweredOperation {
  readonly variables: Readonly<Record<string, unknown>>;
}

const RECOVERY_OPERATIONS: Readonly<
  Record<RecoveryStep, 'RequestPasswordReset' | 'ConfirmPasswordReset'>
> = {
  request: 'RequestPasswordReset',
  confirm: 'ConfirmPasswordReset',
};

export const answerRecoveryOperation = (
  step: RecoveryStep,
  respond: () => Response
): AnsweredOperation[] => {
  const answered: AnsweredOperation[] = [];
  server.use(
    userServiceGraphql.mutation(RECOVERY_OPERATIONS[step], ({ variables }) => {
      answered.push({ variables });
      return respond();
    })
  );
  return answered;
};
