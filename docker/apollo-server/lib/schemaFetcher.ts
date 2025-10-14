import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { createLogger, Logger, format, transports } from 'winston';
import type TransportStream from 'winston-transport';

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

  const transportList: TransportStream[] = [new transports.Console()];

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

export async function fetchAndSaveSchema(outputDir: string): Promise<void> {
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
  const schemaLogger: Logger = getLogger(outputDir);

  if (!SCHEMA_URL) {
    schemaLogger.error('GRAPHQL_SCHEMA_URL is not set. Skipping schema fetch.');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GRAPHQL_SCHEMA_URL is required in production environment');
    }
    return;
  }

  let retries: number = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    if (retries > 0) {
      const backoffTime: number = Math.min(1000 * 2 ** retries, 10000);
      schemaLogger.info(`Retry attempt ${retries}/${MAX_RETRIES} after ${backoffTime}ms`);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, backoffTime);
      });
    }

    schemaLogger.info(
      `Fetching GraphQL schema from: ${SCHEMA_URL}... (Attempt ${retries + 1}/${MAX_RETRIES})`
    );

    const controller: AbortController = new AbortController();
    const timeoutId: NodeJS.Timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response: Response = await fetch(SCHEMA_URL, {
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
      await fsPromises.writeFile(OUTPUT_FILE, data, 'utf-8');

      schemaLogger.info(`Schema successfully saved to: ${OUTPUT_FILE}`);
      return;
    } catch (error) {
      const normalizedError: Error = error instanceof Error ? error : new Error(String(error));
      lastError = normalizedError;
      retries += 1;

      if (normalizedError.name === 'AbortError') {
        schemaLogger.error('Schema fetch timeout after configured time');
      } else {
        schemaLogger.error(`Schema fetch failed: ${normalizedError.message}`);
      }

      if (retries >= MAX_RETRIES) {
        break;
      }
    }
  }

  if (lastError) {
    if (process.env.NODE_ENV === 'production') {
      schemaLogger.info('Schema fetch failed after all retry attempts...');
      throw lastError;
    } else {
      schemaLogger.info('All retry attempts failed, but continuing execution...');
    }
  }
}

export function handleFatalError(error: Error, outputDir?: string): never {
  const errorLogger: Logger = getLogger(outputDir);
  errorLogger.error('Fatal error during schema fetch:', error);
  process.exit(1);
}
