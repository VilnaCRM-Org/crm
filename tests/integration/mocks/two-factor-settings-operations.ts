import server, { userServiceGraphql } from './server';

export type TwoFactorSettingsOperationName =
  | 'SetupTwoFactorUser'
  | 'ConfirmTwoFactorUser'
  | 'DisableTwoFactorUser'
  | 'RegenerateRecoveryCodesUser';

export interface AnsweredTwoFactorSettings {
  readonly variables: Readonly<Record<string, unknown>>;
  readonly authorization: string | null;
}

export const answerTwoFactorSettings = (
  operation: TwoFactorSettingsOperationName,
  respond: () => Response
): AnsweredTwoFactorSettings[] => {
  const answered: AnsweredTwoFactorSettings[] = [];
  server.use(
    userServiceGraphql.mutation(operation, ({ variables, request }) => {
      answered.push({ variables, authorization: request.headers.get('authorization') });
      return respond();
    })
  );
  return answered;
};
