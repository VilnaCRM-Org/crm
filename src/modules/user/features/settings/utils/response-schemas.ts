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
