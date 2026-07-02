import type { CodegenConfig } from '@graphql-codegen/cli';

// GraphQL codegen: turns the upstream user-service SDL + the operation documents
// colocated with their repositories (src/modules/**/*.graphql) into typed operations
// + TypedDocumentNodes.
// The schema is the pinned `schema.graphql` fetched by scripts/codegen.sh (CODEGEN_SCHEMA_PATH).
// This file is build config only — the generated output lives in src/api/generated/graphql.ts
// and must never be hand-edited (see src/api/contracts/README.md).
const schemaPath = process.env.CODEGEN_SCHEMA_PATH ?? '.codegen-cache/schema.graphql';

const config: CodegenConfig = {
  schema: schemaPath,
  documents: ['src/modules/**/*.graphql'],
  ignoreNoDocuments: false,
  generates: {
    // Operation + result types and the TypedDocumentNode for every colocated document.
    // `typescript-operations` self-contains the input types the operations reference, so a
    // single file needs no separate schema-types module (and no duplicate identifiers).
    'src/api/generated/graphql.ts': {
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: true,
        scalars: { ID: 'string' },
        maybeValue: 'T | null',
      },
    },
  },
};

export default config;
