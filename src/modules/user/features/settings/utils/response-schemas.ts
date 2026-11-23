import { z } from '@/config/zod';

const UserNodeSchema = z.object({
  id: z.string(),
  email: z.string(),
  initials: z.string(),
  confirmed: z.boolean(),
});

const ConfirmationNodeSchema = z.object({ id: z.string(), confirmed: z.boolean() });

export const CurrentUserResultSchema = z
  .object({
    users: z
      .object({
        edges: z.array(z.object({ node: UserNodeSchema.nullable() }).nullable()).nullable(),
      })
      .nullable(),
  })
  .nullish();

export const UpdateUserResultSchema = z
  .object({ updateUser: z.object({ user: UserNodeSchema.nullable() }).nullable() })
  .nullish();

export const ResendEmailResultSchema = z
  .object({
    resendEmailToUser: z.object({ user: ConfirmationNodeSchema.nullable() }).nullable(),
  })
  .nullish();

const RecoveryCodesUserSchema = z.object({ recoveryCodes: z.array(z.string().min(1)).min(1) });

export const SetupTwoFactorResultSchema = z
  .object({
    setupTwoFactorUser: z
      .object({
        user: z.object({ otpauthUri: z.string().min(1), secret: z.string().min(1) }).nullable(),
      })
      .nullable(),
  })
  .nullish();

export const ConfirmTwoFactorResultSchema = z
  .object({
    confirmTwoFactorUser: z.object({ user: RecoveryCodesUserSchema.nullable() }).nullable(),
  })
  .nullish();

export const DisableTwoFactorResultSchema = z
  .object({
    disableTwoFactorUser: z
      .object({ user: z.object({ success: z.boolean() }).nullable() })
      .nullable(),
  })
  .nullish();

export const RegenerateRecoveryCodesResultSchema = z
  .object({
    regenerateRecoveryCodesUser: z.object({ user: RecoveryCodesUserSchema.nullable() }).nullable(),
  })
  .nullish();

const ProviderSchema = z.enum(['google', 'facebook', 'github', 'twitter']);

const ProvidersSchema = z
  .array(z.string())
  .transform((names) => names.flatMap((name) => ProviderSchema.safeParse(name).data ?? []));

const ChangedUserSchema = z.object({ user: z.object({ success: z.literal(true) }) });

export const LinkedSocialProvidersResultSchema = z.object({
  linkedSocialProviders: ProvidersSchema,
});

const HTTP_PROTOCOL = /^https?$/;

const LINK_STATE = /^link\../;

const LinkAuthorizationUrlSchema = z.url({ protocol: HTTP_PROTOCOL });

export const InitiateSocialLinkResultSchema = z.object({
  initiateSocialLinkUser: z.object({
    user: z.object({
      authorizationUrl: LinkAuthorizationUrlSchema,
      state: z.string().regex(LINK_STATE),
    }),
  }),
});

export const CompleteSocialLinkResultSchema = z.object({
  completeSocialLinkUser: ChangedUserSchema,
});

export const UnlinkSocialProviderResultSchema = z.object({
  unlinkSocialProviderUser: ChangedUserSchema,
});
