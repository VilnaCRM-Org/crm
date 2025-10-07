import * as path from 'node:path';
import { promises as fsPromises } from 'node:fs';

import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { createLogger, Logger, format, transports } from 'winston';

dotenvExpand.expand(dotenv.config());

// Use path.resolve to get the directory of this file
// This works in both CommonJS (Jest) and ESM contexts
const OUTPUT_DIR: string = __dirname || path.resolve();
const OUTPUT_FILE: string = path.join(OUTPUT_DIR, 'schema.graphql');
let logger: Logger | null = null;

function getLogger(): Logger {
  if (logger) {
    return logger;
  }
  const LOG_LEVEL: string = process.env.GRAPHQL_LOG_LEVEL || 'info';
  const LOG_FILE_PATH: string = process.env.GRAPHQL_LOG_FILE || path.join(OUTPUT_DIR, 'app.log');

  logger = createLogger({
    level: LOG_LEVEL,
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console(), new transports.File({ filename: LOG_FILE_PATH })],
  });
  return logger;
}

export async function fetchAndSaveSchema(): Promise<void> {
  const SCHEMA_URL: string = process.env.GRAPHQL_SCHEMA_URL || '';
  const MAX_RETRIES: number = Number(process.env.GRAPHQL_MAX_RETRIES) || 3;
  const TIMEOUT_MS: number = Number(process.env.GRAPHQL_TIMEOUT_MS) || 5000;
  const logger: Logger = getLogger();

  if (!SCHEMA_URL) {
    logger.error('GRAPHQL_SCHEMA_URL is not set. Skipping schema fetch.');
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
      logger.info(`Retry attempt ${retries}/${MAX_RETRIES} after ${backoffTime}ms`);
      await new Promise<void>((resolve) => setTimeout(resolve, backoffTime));
    }

    logger.info(
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
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }

      try {
        await fsPromises.mkdir(OUTPUT_DIR, { recursive: true });
      } catch (err: any) {
        if (err?.code !== 'EEXIST') {
          throw err;
        }
      }

      const data: string = await response.text();
      await fsPromises.writeFile(OUTPUT_FILE, data, 'utf-8');

      logger.info(`Schema successfully saved to: ${OUTPUT_FILE}`);
      return;
    } catch (error) {
      lastError = error as Error;
      retries += 1;

      if ((error as Error).name === 'AbortError') {
        logger.error('Schema fetch timeout after configured time');
      } else {
        logger.error(`Schema fetch failed: ${(error as Error).message}`);
      }

      if (retries >= MAX_RETRIES) {
        break;
      }
    }
  }

  if (lastError) {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Schema fetch failed after all retry attempts...');
      throw lastError;
    } else {
      logger.info('All retry attempts failed, but continuing execution...');
    }
  }
}
/* istanbul ignore next */
if (require.main === module) {
  fetchAndSaveSchema().catch((error) => {
    const logger: Logger = getLogger();
    logger.error('Fatal error during schema fetch:', error);
    process.exit(1);
  });
}
