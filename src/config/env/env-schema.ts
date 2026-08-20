import { z } from 'zod';

const EnvSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).optional().catch(undefined),
  graphqlUrl: z.url().optional(),
  mockoonUrl: z.url().optional(),
  lhciPreloadedAuthToken: z.string().optional(),
  mainLanguage: z.enum(['uk', 'en']).optional(),
  fallbackLanguage: z.enum(['uk', 'en']).optional(),
  release: z.string().optional(),
  sentryDsn: z.string().optional(),
  sentryEnvironment: z.string().optional(),
  authFailureAlertThreshold: z.coerce.number().int().positive().optional(),
  authFailureAlertWindowMs: z.coerce.number().int().positive().optional(),
});

export default EnvSchema;
