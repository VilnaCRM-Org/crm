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

const RecoveryCodesUserSchema = z.object({ recoveryCodes: z.array(z.string()) });

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
