import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ApolloServer } from '@apollo/server';

import { buildClientMutationId, buildEmail } from '@tests/builders';

import { formatError } from '../../docker/apollo-server/lib/format-error';
import { resolvers } from '../../docker/apollo-server/lib/resolvers';
import { loadTypeDefs, resolveSchemaSource } from '../../docker/apollo-server/lib/schema-loader';
import type { SchemaSource } from '../../docker/apollo-server/lib/types';

import {
  assertSingleResponse,
  PINNED_SDL_FIXTURE,
  PROFILE_SDL_FIXTURE,
  REQUEST_RESET,
} from './mock-schema-fixtures';

const repoRoot = path.resolve(__dirname, '..', '..');
const repoPendingDir = path.join(repoRoot, 'src', 'api', 'contracts', 'pending');
const repoOutDir = path.join(repoRoot, 'docker', 'apollo-server', 'out');

const readRepoFile = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf-8');

const PASSWORD_RESET_SDL = fs.readFileSync(
  path.join(repoPendingDir, 'password-reset.graphql'),
  'utf-8'
);

const PROBE_SDL = `extend type Query {
  pendingProbe: Boolean
}
`;

interface DockerCopy {
  source: string;
  destination: string;
}

interface RuntimeStage {
  workdir: string;
  copies: DockerCopy[];
}

const parseRuntimeStage = (dockerfile: string): RuntimeStage => {
  const lines = dockerfile.split('\n');
  const stageStart = lines.map((line) => line.startsWith('FROM ')).lastIndexOf(true);
  const stage = lines.slice(stageStart);
  const workdirs = stage.filter((line) => line.startsWith('WORKDIR '));
  const copies = stage
    .filter((line) => line.startsWith('COPY '))
    .map((line) => line.split(/\s+/u).filter((token) => !token.startsWith('--')))
    .map(([, source = '', destination = '']) => ({ source, destination }));

  return { workdir: workdirs.at(-1)?.split(/\s+/u)[1] ?? '', copies };
};

describe('pending schema loading on the mock', () => {
  let tmpDir: string;
  let source: SchemaSource;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-pending-schema-'));
    source = {
      schemaFilePath: path.join(tmpDir, 'schema.graphql'),
      pendingSchemaDir: path.join(tmpDir, 'pending'),
    };
    fs.writeFileSync(source.schemaFilePath, PINNED_SDL_FIXTURE);
    fs.mkdirSync(source.pendingSchemaDir);
    fs.writeFileSync(path.join(source.pendingSchemaDir, 'b-probe.graphql'), PROBE_SDL);
    fs.writeFileSync(path.join(source.pendingSchemaDir, 'a-reset.graphql'), PASSWORD_RESET_SDL);
    fs.writeFileSync(path.join(source.pendingSchemaDir, 'notes.md'), 'type Ignored { id: ID }');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads the pinned schema, then every pending .graphql file in name order', () => {
    expect(loadTypeDefs(source)).toEqual([PINNED_SDL_FIXTURE, PASSWORD_RESET_SDL, PROBE_SDL]);
  });

  it('serves a reset mutation and a second pending field from the loaded schema', async () => {
    const server = new ApolloServer({
      typeDefs: [...loadTypeDefs(source), PROFILE_SDL_FIXTURE],
      resolvers,
      formatError,
    });
    await server.start();
    const clientMutationId = buildClientMutationId();

    try {
      const reset = await server.executeOperation({
        query: REQUEST_RESET,
        variables: { input: { email: buildEmail(), clientMutationId } },
      });
      const probe = await server.executeOperation({ query: '{ pendingProbe }' });

      assertSingleResponse(reset.body);
      assertSingleResponse(probe.body);
      expect(reset.body.singleResult.errors).toBeUndefined();
      expect(reset.body.singleResult.data).toEqual({
        requestPasswordResetUser: { user: null, clientMutationId },
      });
      expect(probe.body.singleResult.errors).toBeUndefined();
      expect(probe.body.singleResult.data).toEqual({ pendingProbe: null });
    } finally {
      await server.stop();
    }
  });

  it('refuses an empty pinned schema', () => {
    fs.writeFileSync(source.schemaFilePath, '');

    expect(() => loadTypeDefs(source)).toThrow('Failed to load schema from file.');
  });

  it('serves the pinned schema alone once the last pending contract is retired', () => {
    fs.rmSync(source.pendingSchemaDir, { recursive: true });
    fs.mkdirSync(source.pendingSchemaDir);
    fs.writeFileSync(path.join(source.pendingSchemaDir, '.gitkeep'), '');

    expect(loadTypeDefs(source)).toEqual([PINNED_SDL_FIXTURE]);
  });

  it('refuses a missing pending folder instead of serving without it', () => {
    fs.rmSync(source.pendingSchemaDir, { recursive: true });

    expect(() => loadTypeDefs(source)).toThrow(/ENOENT/u);
  });
});

describe('pending schema wiring of the mock image', () => {
  it('resolves the schema beside out/ and the pending folder to the repository contracts', () => {
    const { schemaFilePath, pendingSchemaDir } = resolveSchemaSource(repoOutDir);

    expect(schemaFilePath).toBe(path.join(repoOutDir, 'schema.graphql'));
    expect(pendingSchemaDir).toBe(repoPendingDir);
    expect(fs.readdirSync(pendingSchemaDir)).toContain('password-reset.graphql');
  });

  it('starts the server from the folder its compiled entry runs in', () => {
    const tsconfig = JSON.parse(readRepoFile('docker/apollo-server/tsconfig.server.json'));

    expect(tsconfig.compilerOptions).toMatchObject({ outDir: './out', rootDir: './' });
    expect(readRepoFile('docker/apollo-server/bootstrap.mjs')).toContain("'out/server.mjs'");
    expect(readRepoFile('docker/apollo-server/server.mts')).toContain(
      'initializeServer(resolveSchemaSource(__dirname))'
    );
  });

  it('keeps the pending folder tracked once its last contract is retired', () => {
    expect(fs.existsSync(path.join(repoPendingDir, '.gitkeep'))).toBe(true);
  });

  it('reads the same pending files codegen reads', () => {
    const codegenGlob = `${path.relative(repoRoot, repoPendingDir)}/*.graphql`;

    expect(readRepoFile('codegen.ts')).toContain(`'${codegenGlob}'`);
  });

  it('copies the pending folder to where the image resolves it from out/', () => {
    const { workdir, copies } = parseRuntimeStage(readRepoFile('Apollo.Dockerfile'));
    const repoPendingPath = path.relative(repoRoot, repoPendingDir);
    const outCopy = copies.find(({ source }) => source.endsWith('/docker/apollo-server/out'));
    const pendingCopy = copies.find(({ source }) => source === repoPendingPath);
    const imageOutDir = path.posix.resolve(workdir, outCopy?.destination ?? '');

    expect(pendingCopy).toBeDefined();
    expect(outCopy).toBeDefined();
    expect(resolveSchemaSource(imageOutDir).pendingSchemaDir).toBe(
      path.posix.resolve(workdir, pendingCopy?.destination ?? '')
    );
  });
});
