import fs from 'node:fs';
import path from 'node:path';

import type { SchemaSource } from './types';

const PENDING_SCHEMA_DIR_FROM_REPO_ROOT = ['src', 'api', 'contracts', 'pending'];
const REPO_ROOT_FROM_OUT_DIR = ['..', '..', '..'];

export function resolveSchemaSource(outDir: string): SchemaSource {
  return {
    schemaFilePath: path.join(outDir, 'schema.graphql'),
    pendingSchemaDir: path.join(
      outDir,
      ...REPO_ROOT_FROM_OUT_DIR,
      ...PENDING_SCHEMA_DIR_FROM_REPO_ROOT
    ),
  };
}

function readPendingSchemas(pendingSchemaDir: string): string[] {
  return fs
    .readdirSync(pendingSchemaDir)
    .filter((fileName) => fileName.endsWith('.graphql'))
    .sort()
    .map((fileName) => fs.readFileSync(path.join(pendingSchemaDir, fileName), 'utf-8'));
}

export function loadTypeDefs({ schemaFilePath, pendingSchemaDir }: SchemaSource): string[] {
  const typeDefs = fs.readFileSync(schemaFilePath, 'utf-8');

  if (!typeDefs) {
    throw new Error('Failed to load schema from file.');
  }

  return [typeDefs, ...readPendingSchemas(pendingSchemaDir)];
}
