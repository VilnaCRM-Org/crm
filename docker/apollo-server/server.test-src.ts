import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

import { ApolloServer, BaseContext } from '@apollo/server';

import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupResources, handleServerFailure, shouldShutdown } from './shutdownFunctions.mjs';
import { resolvers } from './resolvers.mjs';
import { formatError } from './formatError.mjs';

const env: DotenvConfigOutput = dotenv.config();

dotenvExpand.expand(env);

const GRAPHQL_API_PATH = process.env.GRAPHQL_API_PATH || 'graphql';
const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || 'health';

type ApolloServerInstance = ApolloServer<BaseContext> | undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_FILE_PATH = path.join(__dirname, 'schema.graphql');

let server: ApolloServerInstance;

async function startServer() {
  try {
    const typeDefs: string = fs.readFileSync(SCHEMA_FILE_PATH, 'utf-8');

    if (!typeDefs) {
      throw new Error('Failed to load remote schema.');
    }

    if (!resolvers || Object.keys(resolvers).length === 0) {
      throw new Error('Resolvers are missing or not defined properly.');
    }

    server = new ApolloServer<BaseContext>({
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

    console.log(`🚀 GraphQL API ready at ${url}${GRAPHQL_API_PATH}`);
    console.log(`✅ Health Check at ${url}${HEALTH_CHECK_PATH}`);

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    if (server) {
      await gracefulShutdownAndExit(server);
    }
    process.exit(1);
  }
}

process.on('unhandledRejection', async (reason, promise) => {
  const timestamp = new Date().toISOString();
  const errorType = reason instanceof Error ? reason.constructor.name : 'Unknown';
  const errorMessage = reason instanceof Error ? reason.message : String(reason);

  console.error(`[${timestamp}] Unhandled Promise Rejection [${errorType}]:`, {
    message: errorMessage,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });

  if (shouldShutdown(reason)) {
    console.error(`[${timestamp}] Critical error detected, initiating graceful shutdown...`);
    await gracefulShutdownAndExit(server);
  } else {
    console.warn(`[${timestamp}] Recoverable error, system will continue running.`);
  }
});
const TIMEOUT = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 10000;
async function gracefulShutdownAndExit(server: ApolloServerInstance) {
  console.log('Initiating graceful shutdown...');

  if (server) {
    const shutdownTimeout = setTimeout(() => {
      console.error('Graceful shutdown timeout reached. Forcing exit.');
      process.exit(1);
    }, TIMEOUT);

    try {
      await server.stop();
      console.log('Server stopped gracefully.');

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

let isShuttingDown = false;

async function initializeServer() {
  try {
    server = await startServer();

    if (!isShuttingDown) {
      process.once('SIGINT', () => handleShutdown(server, 'SIGINT'));
      process.once('SIGTERM', () => handleShutdown(server, 'SIGTERM'));
    }

    return server;
  } catch (error) {
    console.error('Error starting server:', error);
    await handleServerFailure();
  }
}

async function handleShutdown(server: ApolloServerInstance, signal: string) {
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

async function shutdown(server: ApolloServerInstance) {
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

initializeServer().catch((error) => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});
