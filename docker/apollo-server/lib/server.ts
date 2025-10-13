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

const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || 'health';

export type ApolloServerInstance = ApolloServer<BaseContext> | undefined;

interface StartServerOptions {
  schemaFilePath: string;
}

export interface StartServerResult {
  server: ApolloServer<BaseContext>;
  url: string;
}

const parsedTimeout = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT);
const TIMEOUT = Number.isFinite(parsedTimeout) ? parsedTimeout : 10000;

export async function startServer({
  schemaFilePath,
}: StartServerOptions): Promise<StartServerResult> {
  const typeDefs: string = fs.readFileSync(schemaFilePath, 'utf-8');

  if (!typeDefs) {
    throw new Error('Failed to load schema from file.');
  }

  if (!resolvers || Object.keys(resolvers).length === 0) {
    throw new Error('Resolvers are missing or not defined properly.');
  }

  const server = new ApolloServer<BaseContext>({
    typeDefs,
    resolvers,
    csrfPrevention: true,
    formatError,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.GRAPHQL_PORT) || 4000 },

    context: async ({ req }) => {
      if (req.url?.endsWith(`/${HEALTH_CHECK_PATH}`)) return {};
      const ct = String(req.headers['content-type'] || '').toLowerCase();
      const method = (req.method || '').toUpperCase();
      const allowed = ['application/json', 'application/graphql+json', 'application/graphql'];
      if (method === 'POST') {
        const ok =
          allowed.some((a) => ct.includes(a)) &&
          !ct.includes('text/plain') &&
          !ct.includes('application/x-www-form-urlencoded');
        if (!ok) {
          throw new GraphQLError('Unsupported content-type for POST requests', {
            extensions: { code: 'BAD_REQUEST', http: { status: 400 } },
          });
        }
      }
      return {};
    },
  });

  console.log(`🚀 GraphQL API ready at ${url}`);

  return { server, url };
}

export async function gracefulShutdownAndExit(server: ApolloServerInstance): Promise<void> {
  console.log('Initiating graceful shutdown...');

  if (server) {
    const shutdownTimeout = setTimeout(() => {
      console.error('Graceful shutdown timeout reached. Forcing exit.');
      process.exit(1);
    }, TIMEOUT);

    try {
      await server.stop();
      console.log('Server stopped gracefully.');

      await cleanupResources();
      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (shutdownError) {
      console.error('Error during graceful shutdown:', shutdownError);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  } else {
    console.error('No server instance found for shutdown.');
    process.exit(1);
  }
}

export async function shutdown(server: ApolloServerInstance): Promise<void> {
  try {
    if (server && typeof server.stop === 'function') {
      await server.stop();
      console.log('Apollo Server stopped');
    } else {
      console.warn('Server instance missing stop method');
    }
  } catch (err) {
    console.error('Error while closing server connections:', err);
    throw new Error('Failed to shut down the server gracefully');
  }

  await cleanupResources();
}

export async function setupUnhandledRejectionHandler(server: ApolloServerInstance): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    process.on('unhandledRejection', async (reason) => {
      const timestamp = new Date().toISOString();
      const errorType = reason instanceof Error ? reason.constructor.name : 'Unknown';
      const errorMessage = reason instanceof Error ? reason.message : String(reason);

      console.error(`[${timestamp}] Unhandled Promise Rejection [${errorType}]:`, {
        message: errorMessage,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: '[object Promise]',
      });

      if (shouldShutdown(reason)) {
        console.error(`[${timestamp}] Critical error detected, initiating graceful shutdown...`);
        await gracefulShutdownAndExit(server);
      } else {
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
    console.error('Error starting server:', error);
    await handleServerFailure();
    throw error;
  }
}

async function handleShutdown(server: ApolloServerInstance, signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Gracefully shutting down...`);

  try {
    await shutdown(server);
    console.log('Server shutdown completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during server shutdown:', error);
    process.exit(1);
  }
}
