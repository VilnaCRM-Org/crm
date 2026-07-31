import { z } from 'zod';

// `z.httpUrl()` rather than `z.url()`: both settings are HTTP endpoints, and the container
// entrypoint already rejects every other scheme. Keeping the browser contract identical means a
// block that reaches the document without passing through the renderer cannot smuggle in a
// `mailto:` or `javascript:` value that only fails later inside the HTTP clients.
const AppConfigSchema = z.strictObject({
  apiBaseUrl: z.httpUrl().optional(),
  graphqlUrl: z.httpUrl().optional(),
  flags: z
    .strictObject({
      forgotPassword: z.boolean().optional(),
    })
    .optional(),
});

export default AppConfigSchema;
