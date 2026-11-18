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

// GET /api/auth/social/{provider}/callback (user-service, not in the pinned v2.8.0 spec yet; see
// src/api/contracts/README.md, "Pending REST operations"). The body is a union on `2fa_enabled`:
// a direct sign-in carries the access token, a 2FA account carries the pending session instead.
// `refresh_token` is not read by this client, so it is not declared and the parse drops it.
export const SocialCallbackResponseSchema = z.discriminatedUnion('2fa_enabled', [
  z.object({ '2fa_enabled': z.literal(false), access_token: z.string().min(1) }),
  z.object({ '2fa_enabled': z.literal(true), pending_session_id: z.string().min(1) }),
]);

// The RFC 7807 body both social endpoints answer with; `error_code` selects the message.
export const SocialAuthProblemSchema = z.object({
  status: z.number().int(),
  error_code: z.string().min(1),
});
