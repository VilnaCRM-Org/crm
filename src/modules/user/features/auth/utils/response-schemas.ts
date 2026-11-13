import { z } from '@/config/zod';

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

const SignInUserNodeSchema = z.object({
  twoFactorEnabled: z.boolean().nullish(),
  accessToken: z.string().nullish(),
  pendingSessionId: z.string().nullish(),
});

export const SignInUserResultSchema = z
  .object({
    signInUser: z.object({ user: SignInUserNodeSchema.nullish() }).nullish(),
  })
  .nullish();

const CompleteTwoFactorUserNodeSchema = z.object({
  accessToken: z.string().nullish(),
  recoveryCodesRemaining: z.number().int().nonnegative().nullish(),
});

export const CompleteTwoFactorUserResultSchema = z
  .object({
    completeTwoFactorUser: z.object({ user: CompleteTwoFactorUserNodeSchema.nullish() }).nullish(),
  })
  .nullish();
