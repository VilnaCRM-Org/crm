import { z } from 'zod';

const EnvSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).optional().catch(undefined),
  graphqlUrl: z.url().optional(),
  mockoonUrl: z.url().optional(),
  mainLanguage: z.enum(['uk', 'en']).optional(),
  fallbackLanguage: z.enum(['uk', 'en']).optional(),
  release: z.string().optional(),
  sentryDsn: z.string().optional(),
  sentryEnvironment: z.string().optional(),
});

export default EnvSchema;
