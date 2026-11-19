import { z } from '@/config/zod';

export const LoginResponseSchema = z.object({ token: z.string() });

export const RegistrationResponseSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),

  // TODO: Reintroduce `fullName` and `email` fields once the backend includes them in the response.
  //       When re-enabled, update client-side validation and field-level error display accordingly.
  // fullName: z.string().trim().min(1, 'Full name is required'),
  // email: z.string().trim().email('Invalid email'),
});

// GraphQL createUser result validator. Mirrors the generated `CreateUserMutation` shape
// (see src/api/generated/graphql.ts) so the registration repository parses — never casts —
// the Apollo result at the trust boundary. `createUser`/`user` are nullable in the schema,
// and the whole payload is nullish because Apollo may resolve `data` to null/undefined.
const CreateUserNodeSchema = z.object({
  id: z.string(),
  confirmed: z.boolean(),
  email: z.string(),
  initials: z.string(),
});

export const CreateUserResultSchema = z
  .object({
    createUser: z
      .object({
        // The user node is validated strictly; the incidental envelope fields are lenient
        // (nullish) because Apollo/mock responses may omit them and the flow ignores them.
        user: CreateUserNodeSchema.nullish(),
        clientMutationId: z.string().nullish(),
      })
      .nullish(),
  })
  .nullish();

// The social sign-in mutations (src/api/contracts/pending/social-sign-in.graphql; pending until a
// user-service release declares them). The authorization URL leaves the app, so only an http(s)
// URL is accepted; the access token or the pending 2FA session must be present for its branch.
const SocialAuthorizationUrlSchema = z.url({ protocol: /^https?$/ });

export const SocialInitiateResultSchema = z.object({
  initiateSocialSignInUser: z.object({
    user: z.object({ authorizationUrl: SocialAuthorizationUrlSchema, state: z.string().min(1) }),
  }),
});

export const SocialCompleteResultSchema = z.object({
  completeSocialSignInUser: z.object({
    user: z.union([
      z.object({ twoFactorEnabled: z.literal(true), pendingSessionId: z.string().min(1) }),
      z.object({
        twoFactorEnabled: z.literal(false).nullish(),
        accessToken: z.string().min(1),
      }),
    ]),
  }),
});
