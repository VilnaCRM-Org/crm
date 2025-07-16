import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

import { ApolloServer, BaseContext } from '@apollo/server';

import { startStandaloneServer } from '@apollo/server/standalone';
import { GraphQLError } from 'graphql';
import { ApolloServerErrorCode } from '@apollo/server/errors';

// @ts-ignore - Import path uses .ts extension which is resolved at runtime
import { CreateUserInput, CreateUserResponse, User } from './type.ts';

import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';

const env: DotenvConfigOutput = dotenv.config();

dotenvExpand.expand(env);

const GRAPHQL_API_PATH = process.env.GRAPHQL_API_PATH || 'graphql';
const HEALTH_CHECK_PATH = process.env.HEALTH_CHECK_PATH || 'health';

const validateCreateUserInput = (input: CreateUserInput) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!input.email || !emailRegex.test(input.email)) {
    throw new GraphQLError('Invalid email format', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }

  if (!input.initials || input.initials.length < 2) {
    throw new GraphQLError('Invalid initials', {
      extensions: {
        code: 'BAD_REQUEST',
        http: { status: 400 },
      },
    });
  }
};
export const users = new Map<string, User>();
export const resolvers = {
  Mutation: {
    createUser: async (
      _: unknown,
      { input }: { input: CreateUserInput }
    ): Promise<CreateUserResponse> => {
      validateCreateUserInput(input);
      try {
        const newUser: User = {
          id: input.clientMutationId || uuidv4(),
          confirmed: true,
          email: input.email,
          initials: input.initials,
        };
        users.set(newUser.email, newUser);
        return {
          data: {
            createUser: {
              user: newUser,
              clientMutationId: input.clientMutationId,
            },
          },
        };
      } catch (error) {
        throw new GraphQLError('Internal Server Error: Failed to create user', {
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            http: {
              status: 500,
              headers: { 'x-error-type': 'server-error' },
            },
          },
        });
      }
    },
  },
};
const formatError = (formattedError: any, error: any) => {
  if (formattedError.extensions.code === 'INTERNAL_SERVER_ERROR') {
    return {
      ...formattedError,
      message: 'Something went wrong on the server. Please try again later.',
      details: error.message,
    };
  }

  if (formattedError.extensions.code === 'BAD_REQUEST') {
    return {
      ...formattedError,
      message: 'The request was invalid. Please check your input.',
      details: error.message,
    };
  }

  if (formattedError.extensions.code === ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED) {
    return {
      ...formattedError,
      message: "Your query doesn't match the schema. Please check it!",
    };
  }

  return formattedError;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_FILE_PATH = path.join(__dirname, 'schema.graphql');

let server: ApolloServer<BaseContext>;

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
      csrfPrevention: {
        requestHeaders: ['Apollo-Require-Preflight', 'X-Apollo-Operation-Name'],
      },
      formatError,
    });

    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },

      context: async ({ req }) => {
        if (req.url === HEALTH_CHECK_PATH) {
          return {};
        }

        if (!req.headers['content-type'] || req.headers['content-type'].includes('text/plain')) {
          throw new Error('Invalid content-type header for CSRF prevention.');
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
    setTimeout(() => {
      process.exit(1);
    }, 3000);
  }
}

process.on('unhandledRejection', async (reason, promise) => {
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] Unhandled Promise Rejection:`, { reason, promise });

  if (shouldShutdown(reason)) {
    console.error(`[${timestamp}] Critical error detected, initiating graceful shutdown...`);
    await gracefulShutdownAndExit(server);
  } else {
    console.warn(`[${timestamp}] Recoverable error, system will continue running.`);
  }
});

function shouldShutdown(error: unknown): boolean {
  return error instanceof Error && error.message.includes('critical');
}
async function gracefulShutdownAndExit(
  server: any,
  timeout: number = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT) || 10000
) {
  console.log('Initiating graceful shutdown...');

  if (server) {
    const shutdownTimeout = setTimeout(() => {
      console.error('Graceful shutdown timeout reached. Forcing exit.');
      process.exit(1);
    }, timeout);

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
    const server = await startServer();

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

async function handleShutdown(server: any, signal: string) {
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

async function shutdown(server: any) {
  try {
    if (server && typeof server.stop === 'function') {
      await server.stop();
      console.log('Apollo Server stopped');
    } else {
      console.warn('Server instance missing stop method');
    }
  } catch (err) {
    console.error('Error while closing server connections:', err);
    const error = new Error('Failed to shut down the server gracefully');
    (error as any).cause = err;
    throw error;
  }

  await cleanupResources();
}

async function handleServerFailure() {
  console.log('Attempting to clean up before exiting...');
  await cleanupResources();
  await gracefulShutdownAndExit(server);
}

async function cleanupResources() {
  try {
    console.log('Cleaning up resources...');

    await closeDatabaseConnections();

    console.log('Cleanup complete.');
  } catch (err) {
    console.error('Error cleaning up resources:', err);
  }
}

async function closeDatabaseConnections() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

initializeServer().catch((error) => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});
