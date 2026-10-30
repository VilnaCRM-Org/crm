import { GraphQLError } from 'graphql';

import type {
  ClientMutationInput,
  CompleteTwoFactorInput,
  SignInUserInput,
  TwoFactorCodeInput,
  TwoFactorPayload,
  TwoFactorPayloadData,
} from './types';
import { EMAIL_REGEX, MAX_EMAIL_LENGTH, rejectViolation } from './violations';

const TOTP_CODE_REGEX = /^\d{6}$/u;
const RECOVERY_CODE_REGEX = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/u;

const CHALLENGE_LOCAL_PART = '2fa';
const ACCEPTED_TOTP_CODE = '123456';

const MOCK_PAYLOAD_ID = '/api/users/0193a9e2-7c1d-7d8e-9f3a-5b6c7d8e9f01';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token';
const MOCK_PENDING_SESSION_ID = '01JAQZ8M3K5N7P9R2T4V6X8Z0B';
const MOCK_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const MOCK_OTPAUTH_URI = `otpauth://totp/VilnaCRM%3Aolena.petrenko%40example.com?secret=${MOCK_SECRET}&issuer=VilnaCRM`;
const MOCK_RECOVERY_CODES: readonly string[] = [
  'AB12-CD34',
  'EF56-GH78',
  'JK90-LM12',
  'NP34-QR56',
  'ST78-UV90',
  'WX12-YZ34',
  'AB56-CD78',
  'EF90-GH12',
];

const BLANK_PAYLOAD_DATA: TwoFactorPayloadData = {
  id: MOCK_PAYLOAD_ID,
  _id: MOCK_PAYLOAD_ID,
  success: true,
  twoFactorEnabled: null,
  accessToken: null,
  refreshToken: null,
  pendingSessionId: null,
  otpauthUri: null,
  secret: null,
  recoveryCodes: [],
  recoveryCodesRemaining: null,
  warning: null,
};

const twoFactorPayload = (
  data: Partial<TwoFactorPayloadData>,
  { clientMutationId }: ClientMutationInput
): TwoFactorPayload => ({
  user: { ...BLANK_PAYLOAD_DATA, ...data },
  clientMutationId: clientMutationId ?? null,
});

const rejectBlank = (property: string, value: string): void => {
  if (value.trim() === '') rejectViolation(property, 'This value should not be blank.');
};

const rejectMalformedCode = (code: string, shapes: readonly RegExp[]): void => {
  if (!shapes.some((shape) => shape.test(code))) {
    rejectViolation('twoFactorCode', 'This value is not a valid two-factor code.');
  }
};

const rejectWrongCode = (code: string): void => {
  if (code !== ACCEPTED_TOTP_CODE) {
    throw new GraphQLError('Invalid two-factor code.', {
      extensions: { code: 'UNAUTHENTICATED', status: 401 },
    });
  }
};

const requiresChallenge = (email: string): boolean =>
  email.slice(0, email.indexOf('@')).toLowerCase() === CHALLENGE_LOCAL_PART;

export const twoFactorResolvers = {
  Mutation: {
    signInUser: async (
      _: unknown,
      { input }: { input: SignInUserInput }
    ): Promise<TwoFactorPayload> => {
      if (input.email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(input.email)) {
        rejectViolation('email', 'This value is not a valid email address.');
      }
      rejectBlank('password', input.password);
      return twoFactorPayload(
        requiresChallenge(input.email)
          ? { twoFactorEnabled: true, pendingSessionId: MOCK_PENDING_SESSION_ID }
          : {
              twoFactorEnabled: false,
              accessToken: MOCK_ACCESS_TOKEN,
              refreshToken: MOCK_REFRESH_TOKEN,
            },
        input
      );
    },
    completeTwoFactorUser: async (
      _: unknown,
      { input }: { input: CompleteTwoFactorInput }
    ): Promise<TwoFactorPayload> => {
      rejectBlank('pendingSessionId', input.pendingSessionId);
      rejectMalformedCode(input.twoFactorCode, [TOTP_CODE_REGEX, RECOVERY_CODE_REGEX]);
      rejectWrongCode(input.twoFactorCode);
      return twoFactorPayload(
        {
          twoFactorEnabled: true,
          accessToken: MOCK_ACCESS_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
        },
        input
      );
    },
    setupTwoFactorUser: async (
      _: unknown,
      { input }: { input: ClientMutationInput }
    ): Promise<TwoFactorPayload> =>
      twoFactorPayload({ otpauthUri: MOCK_OTPAUTH_URI, secret: MOCK_SECRET }, input),
    confirmTwoFactorUser: async (
      _: unknown,
      { input }: { input: TwoFactorCodeInput }
    ): Promise<TwoFactorPayload> => {
      rejectMalformedCode(input.twoFactorCode, [TOTP_CODE_REGEX]);
      return twoFactorPayload({ recoveryCodes: [...MOCK_RECOVERY_CODES] }, input);
    },
    disableTwoFactorUser: async (
      _: unknown,
      { input }: { input: TwoFactorCodeInput }
    ): Promise<TwoFactorPayload> => {
      rejectMalformedCode(input.twoFactorCode, [TOTP_CODE_REGEX, RECOVERY_CODE_REGEX]);
      return twoFactorPayload({}, input);
    },
    regenerateRecoveryCodesUser: async (
      _: unknown,
      { input }: { input: ClientMutationInput }
    ): Promise<TwoFactorPayload> =>
      twoFactorPayload({ recoveryCodes: [...MOCK_RECOVERY_CODES] }, input),
  },
};
