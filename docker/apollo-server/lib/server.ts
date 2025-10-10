import fs from 'node:fs';

import { ApolloServer, BaseContext } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { GraphQLError } from 'graphql';

import { formatError } from './formatError';
import { resolvers } from './resolvers';
import { cleanupResources, handleServerFailure, shouldShutdown } from './shutdownFunctions';

const env: DotenvConfigOutput = dotenv.config();
dotenvExpand.expand(env);

const GRAPHQL_API_PATH = process.env.GRAPHQL_API_PATH || 'graphql';
const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || 'health';

export type ApolloServerInstance = ApolloServer<BaseContext> | undefined;

interface StartServerOptions {
  schemaFilePath: string;
}

export interface StartServerResult {
  server: ApolloServer<BaseContext>;
  url: string;
}

const TIMEOUT = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 10000;

export async function startServer({
  schemaFilePath,
}: StartServerOptions): Promise<StartServerResult> {
  const typeDefs: string = fs.readFileSync(schemaFilePath, 'utf-8');

  if (!typeDefs) {
    throw new Error('Failed to load remote schema.');
  }

  if (!resolvers || Object.keys(resolvers).length === 0) {
    throw new Error('Resolvers are missing or not defined properly.');
  }

  const server = new ApolloServer<BaseContext>({
    typeDefs,
    resolvers,
    csrfPrevention: false,
    formatError,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.GRAPHQL_PORT) || 4000 },

    context: async ({ req }) => {
      if (req.url?.endsWith(`/${HEALTH_CHECK_PATH}`)) return {};
      const ct = String(req.headers['content-type'] || '').toLowerCase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = typeof (req as any).body?.query === 'string' ? (req as any).body.query : '';
      const isMutation = /^\s*mutation\b/i.test(query);
      const allowed = ['application/json', 'application/graphql+json', 'application/graphql'];
      if (isMutation) {
        const ok = allowed.some((a) => ct.includes(a)) && !ct.includes('text/plain');
        if (!ok) {
          throw new GraphQLError('Invalid content-type header for CSRF prevention', {
            extensions: { code: 'BAD_REQUEST', http: { status: 400 } },
          });
        }
      }
      return {};
    },
  });

  // eslint-disable-next-line no-console
  console.log(`🚀 GraphQL API ready at ${url}${GRAPHQL_API_PATH}`);
  // eslint-disable-next-line no-console
  console.log(`✅ Health Check at ${url}${HEALTH_CHECK_PATH}`);

  return { server, url };
}

export async function gracefulShutdownAndExit(server: ApolloServerInstance): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Initiating graceful shutdown...');

  if (server) {
    const shutdownTimeout = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error('Graceful shutdown timeout reached. Forcing exit.');
      process.exit(1);
    }, TIMEOUT);

    try {
      await server.stop();
      // eslint-disable-next-line no-console
      console.log('Server stopped gracefully.');

      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (shutdownError) {
      // eslint-disable-next-line no-console
      console.error('Error during graceful shutdown:', shutdownError);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error('No server instance found for shutdown.');
    process.exit(1);
  }
}

export async function shutdown(server: ApolloServerInstance): Promise<void> {
  try {
    if (server && typeof server.stop === 'function') {
      await server.stop();
      // eslint-disable-next-line no-console
      console.log('Apollo Server stopped');
    } else {
      // eslint-disable-next-line no-console
      console.warn('Server instance missing stop method');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error while closing server connections:', err);
    throw new Error('Failed to shut down the server gracefully');
  }

  await cleanupResources();
}

export async function setupUnhandledRejectionHandler(server: ApolloServerInstance): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    process.on('unhandledRejection', async (reason, promise) => {
      const timestamp = new Date().toISOString();
      const errorType = reason instanceof Error ? reason.constructor.name : 'Unknown';
      const errorMessage = reason instanceof Error ? reason.message : String(reason);

      // eslint-disable-next-line no-console
      console.error(`[${timestamp}] Unhandled Promise Rejection [${errorType}]:`, {
        message: errorMessage,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
      });

      if (shouldShutdown(reason)) {
        // eslint-disable-next-line no-console
        console.error(`[${timestamp}] Critical error detected, initiating graceful shutdown...`);
        await gracefulShutdownAndExit(server);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[${timestamp}] Recoverable error, system will continue running.`);
      }
    });
  }
}

let isShuttingDown = false;

export async function initializeServer(schemaFilePath: string): Promise<ApolloServer<BaseContext>> {
  try {
    const { server } = await startServer({ schemaFilePath });

    await setupUnhandledRejectionHandler(server);

    if (!isShuttingDown) {
      process.once('SIGINT', () => handleShutdown(server, 'SIGINT'));
      process.once('SIGTERM', () => handleShutdown(server, 'SIGTERM'));
    }

    return server;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error starting server:', error);
    await handleServerFailure();
    throw error;
  }
}

async function handleShutdown(server: ApolloServerInstance, signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Gracefully shutting down...`);

  try {
    await shutdown(server);
    // eslint-disable-next-line no-console
    console.log('Server shutdown completed.');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during server shutdown:', error);
    process.exit(1);
  }
}
