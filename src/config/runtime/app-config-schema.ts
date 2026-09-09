import { z } from 'zod';

// Protocol-constrained rather than bare `z.url()`: both settings are HTTP endpoints, and the
// container entrypoint already rejects every other scheme, so a block that reaches the document
// without passing through the renderer must not be able to smuggle in a `mailto:` or
// `javascript:` value that only fails later inside the HTTP clients.
//
// NOT `z.httpUrl()`, which additionally requires a dotted hostname: it rejects
// `http://localhost:4000/graphql` (the GraphQLUrl fallback) and `http://prod:3001` (the compose
// service names the e2e and Lighthouse stacks use). This form matches `assertHttpUrl` in
// scripts/render-app-config.js and `isHttpUrl` in app-config-source.ts exactly — all three layers
// accept the same set, so validation can never disagree across them.
const HttpUrl = z.url({ protocol: /^https?$/ });

const AppConfigSchema = z.strictObject({
  apiBaseUrl: HttpUrl.optional(),
  graphqlUrl: HttpUrl.optional(),
  flags: z
    .strictObject({
      forgotPassword: z.boolean().optional(),
    })
    .optional(),
});

export default AppConfigSchema;
