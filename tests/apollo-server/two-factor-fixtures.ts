import fs from 'node:fs';
import path from 'node:path';

import { PINNED_SDL_FIXTURE, PROFILE_SDL_FIXTURE } from './mock-schema-fixtures';

export const PENDING_DIR = path.join(__dirname, '..', '..', 'src', 'api', 'contracts', 'pending');

export const TWO_FACTOR_PENDING_SDL = fs.readFileSync(
  path.join(PENDING_DIR, 'two-factor-authentication.graphql'),
  'utf-8'
);

export const NODE_SDL_FIXTURE = `#graphql
  interface Node {
    id: ID!
  }
`;

export const TWO_FACTOR_SDL_FIXTURES: string[] = [NODE_SDL_FIXTURE, TWO_FACTOR_PENDING_SDL];

export const PENDING_SDL_FILES: string[] = fs
  .readdirSync(PENDING_DIR)
  .filter((fileName) => fileName.endsWith('.graphql'))
  .sort()
  .map((fileName) => fs.readFileSync(path.join(PENDING_DIR, fileName), 'utf-8'));

export const TWO_FACTOR_TYPE_DEFS: string[] = [
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  NODE_SDL_FIXTURE,
  ...PENDING_SDL_FILES,
];

export const SIGN_IN = `
  mutation SignInUser($input: signInUserInput!) {
    signInUser(input: $input) {
      user { success twoFactorEnabled accessToken refreshToken pendingSessionId }
      clientMutationId
    }
  }
`;

export const COMPLETE = `
  mutation CompleteTwoFactorUser($input: completeTwoFactorUserInput!) {
    completeTwoFactorUser(input: $input) {
      user { twoFactorEnabled accessToken refreshToken recoveryCodesRemaining }
      clientMutationId
    }
  }
`;

export const SETUP = `
  mutation SetupTwoFactorUser($input: setupTwoFactorUserInput!) {
    setupTwoFactorUser(input: $input) {
      user { otpauthUri secret }
      clientMutationId
    }
  }
`;

export const CONFIRM = `
  mutation ConfirmTwoFactorUser($input: confirmTwoFactorUserInput!) {
    confirmTwoFactorUser(input: $input) {
      user { recoveryCodes }
      clientMutationId
    }
  }
`;

export const DISABLE = `
  mutation DisableTwoFactorUser($input: disableTwoFactorUserInput!) {
    disableTwoFactorUser(input: $input) {
      user { success }
      clientMutationId
    }
  }
`;

export const REGENERATE = `
  mutation RegenerateRecoveryCodesUser($input: regenerateRecoveryCodesUserInput!) {
    regenerateRecoveryCodesUser(input: $input) {
      user { recoveryCodes }
      clientMutationId
    }
  }
`;
