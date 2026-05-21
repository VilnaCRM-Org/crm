import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import type * as Transport from 'winston/lib/winston/transports';
import { createLogger, Logger, format, transports } from 'winston';

dotenvExpand.expand(dotenv.config());

const loggers: Map<string, Logger> = new Map();

export function getLogger(outputDir?: string): Logger {
  const key = outputDir || process.cwd();
  const cached = loggers.get(key);
  if (cached) {
    return cached;
  }
  const LOG_LEVEL: string = process.env.GRAPHQL_LOG_LEVEL || 'info';
  const LOG_FILE_PATH: string =
    process.env.GRAPHQL_LOG_FILE || path.join(outputDir || process.cwd(), 'app.log');

  const transportList: (Transport.ConsoleTransportInstance | Transport.FileTransportInstance)[] = [
    new transports.Console(),
  ];

  try {
    transportList.push(new transports.File({ filename: LOG_FILE_PATH }));
  } catch (e) {
    console.warn(
      `Logger file transport could not be initialized (${e instanceof Error ? e.message : String(e)}), using console only.`
    );
  }
  const newLogger = createLogger({
    level: LOG_LEVEL,
    format: format.combine(format.timestamp(), format.json()),
    transports: transportList,
  });
  loggers.set(key, newLogger);
  return newLogger;
}

interface SchemaFetchConfig {
  SCHEMA_URL: string;
  MAX_RETRIES: number;
  TIMEOUT_MS: number;
  OUTPUT_FILE: string;
}

function resolveSchemaConfig(outputDir: string): SchemaFetchConfig {
  const SCHEMA_URL: string = process.env.GRAPHQL_SCHEMA_URL || '';
  const parsedRetries = Number(process.env.GRAPHQL_MAX_RETRIES);
  const MAX_RETRIES: number = Number.isFinite(parsedRetries)
    ? Math.max(1, Math.floor(parsedRetries))
    : 3;
  const parsedTimeout = Number(process.env.GRAPHQL_TIMEOUT_MS);
  const TIMEOUT_MS: number = Number.isFinite(parsedTimeout)
    ? Math.max(1, Math.floor(parsedTimeout))
    : 5000;
  const OUTPUT_FILE: string = path.join(outputDir, 'schema.graphql');
  return { SCHEMA_URL, MAX_RETRIES, TIMEOUT_MS, OUTPUT_FILE };
}

async function attemptSchemaFetch(config: SchemaFetchConfig, outputDir: string): Promise<void> {
  const controller: AbortController = new AbortController();
  const timeoutId: NodeJS.Timeout = setTimeout(() => controller.abort(), config.TIMEOUT_MS);

  const response: Response = await fetch(config.SCHEMA_URL, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'GraphQL/SchemaFetcher',
      Accept: 'text/plain, application/graphql, application/json;q=0.9, */*;q=0.8',
    },
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }

  try {
    await fsPromises.mkdir(outputDir, { recursive: true });
  } catch (err) {
    const normalizedErr: Error = err instanceof Error ? err : new Error(String(err));
    const fsError = normalizedErr as NodeJS.ErrnoException;
    if (fsError.code !== 'EEXIST') {
      throw normalizedErr;
    }
  }

  const data: string = await response.text();
  await fsPromises.writeFile(config.OUTPUT_FILE, data, 'utf-8');
}

function shouldFetchSchema(config: SchemaFetchConfig, schemaLogger: Logger): boolean {
  if (config.SCHEMA_URL) {
    return true;
  }

  schemaLogger.error('GRAPHQL_SCHEMA_URL is not set. Skipping schema fetch.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('GRAPHQL_SCHEMA_URL is required in production environment');
  }

  return false;
}

function getRetryBackoffTime(retries: number): number {
  return Math.min(1000 * 2 ** retries, 10000);
}

async function waitForRetryDelay(
  retries: number,
  maxRetries: number,
  schemaLogger: Logger
): Promise<void> {
  if (retries === 0) {
    return;
  }

  const backoffTime: number = getRetryBackoffTime(retries);
  schemaLogger.info(`Retry attempt ${retries}/${maxRetries} after ${backoffTime}ms`);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, backoffTime);
  });
}

function logFetchAttempt(config: SchemaFetchConfig, retries: number, schemaLogger: Logger): void {
  schemaLogger.info(
    `Fetching GraphQL schema from: ${config.SCHEMA_URL}... (Attempt ${retries + 1}/${config.MAX_RETRIES})`
  );
}

function normalizeSchemaFetchError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function logSchemaFetchError(error: Error, schemaLogger: Logger): void {
  if (error.name === 'AbortError') {
    schemaLogger.error('Schema fetch timeout after configured time');
    return;
  }

  schemaLogger.error(`Schema fetch failed: ${error.message}`);
}

async function fetchSchemaWithRetries(
  config: SchemaFetchConfig,
  outputDir: string,
  schemaLogger: Logger
): Promise<Error | null> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < config.MAX_RETRIES) {
    await waitForRetryDelay(retries, config.MAX_RETRIES, schemaLogger);
    logFetchAttempt(config, retries, schemaLogger);

    try {
      await attemptSchemaFetch(config, outputDir);
      schemaLogger.info(`Schema successfully saved to: ${config.OUTPUT_FILE}`);
      return null;
    } catch (error) {
      lastError = normalizeSchemaFetchError(error);
      logSchemaFetchError(lastError, schemaLogger);
      retries += 1;
    }
  }

  return lastError;
}

export async function fetchAndSaveSchema(outputDir: string): Promise<void> {
  const config = resolveSchemaConfig(outputDir);
  const schemaLogger: Logger = getLogger(outputDir);

  if (!shouldFetchSchema(config, schemaLogger)) {
    return;
  }

  const lastError = await fetchSchemaWithRetries(config, outputDir, schemaLogger);
  handleFinalError(lastError, schemaLogger, outputDir);
}

/**
 * Final guard for the schema fetch CLI entrypoint.
 * Intended to be called by the command-line wrapper (`schema-fetcher.mts`) when an unhandled
 * error bubbles up so we can log the context and exit with a failure code.
 *
 * ts-prune-ignore-next - used by the .mts CLI entrypoint so it won't appear in TS import graphs.
 */
// ts-prune-ignore-next
export function handleFatalError(error: Error, outputDir?: string): never {
  const errorLogger: Logger = getLogger(outputDir);
  errorLogger.error('Fatal error during schema fetch:', error);
  process.exit(1);
}

export function handleFinalError(
  lastError: Error | null,
  schemaLogger: Logger,
  outputDir?: string
): void {
  if (!lastError) {
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    schemaLogger.info('Schema fetch failed after all retry attempts; exiting.');
    handleFatalError(lastError, outputDir);
  }

  schemaLogger.info('All retry attempts failed, but continuing execution...');
}
