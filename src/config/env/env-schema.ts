import { z } from 'zod';

const EnvSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).optional().catch(undefined),
  graphqlUrl: z.url().optional(),
  mockoonUrl: z.url().optional(),
  lhciPreloadedAuthToken: z.string().optional(),
  mainLanguage: z.enum(['uk', 'en']).optional(),
  fallbackLanguage: z.enum(['uk', 'en']).optional(),
});

export default EnvSchema;
