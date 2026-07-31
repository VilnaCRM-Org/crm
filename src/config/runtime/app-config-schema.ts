import { z } from 'zod';

const AppConfigSchema = z.strictObject({
  apiBaseUrl: z.url().optional(),
  graphqlUrl: z.url().optional(),
  flags: z
    .strictObject({
      forgotPassword: z.boolean().optional(),
    })
    .optional(),
});

export default AppConfigSchema;
