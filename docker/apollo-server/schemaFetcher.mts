import * as path from 'node:path';
import { promises as fsPromises } from 'node:fs';
import { fileURLToPath } from 'url';

import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { createLogger, Logger, format, transports } from 'winston';

const env: DotenvConfigOutput = dotenv.config();

dotenvExpand.expand(env);

const SCHEMA_URL: string = process.env.GRAPHQL_SCHEMA_URL || '';

if (!SCHEMA_URL) {
  throw new Error(
    'Schema URL is not configured. Please set the GRAPHQL_SCHEMA_URL environment variable.'
  );
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR: string = path.join(__dirname);
const OUTPUT_FILE: string = path.join(OUTPUT_DIR, 'schema.graphql');
const LOG_LEVEL: string = process.env.GRAPHQL_LOG_LEVEL || 'info';

const LOG_FILE_PATH: string = process.env.GRAPHQL_LOG_FILE || 'app.log';

const logger: Logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console(), new transports.File({ filename: LOG_FILE_PATH })],
});
const MAX_RETRIES: number = Number(process.env.GRAPHQL_MAX_RETRIES) || 3;
const TIMEOUT_MS: number = Number(process.env.GRAPHQL_TIMEOUT_MS) || 5000;

export async function fetchAndSaveSchema(): Promise<void> {
  let retries: number = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    if (retries > 0) {
      const backoffTime: number = Math.min(1000 * 2 ** retries, 10000);
      logger.info(`Retry attempt ${retries}/${MAX_RETRIES} after ${backoffTime}ms`);
      await new Promise<void>((resolve) => setTimeout(resolve, backoffTime));
    }

    logger.info(
      `Fetching OpenAPI schema from: ${SCHEMA_URL}... (Attempt ${retries + 1}/${MAX_RETRIES})`
    );

    const controller: AbortController = new AbortController();
    const timeoutId: NodeJS.Timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response: Response = await fetch(SCHEMA_URL, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'GraphQL/SchemaFetcher',
          Accept: 'application/json',
        },
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.statusText}`);
      }

      try {
        await fsPromises.mkdir(OUTPUT_DIR, { recursive: true });
      } catch (err) {}

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
      logger.info('Exiting process due to repeated errors...');
      process.exit(1);
    } else {
      logger.info('All retry attempts failed, but continuing execution...');
    }
  }
}
if (process.argv[1] === __filename) {
  fetchAndSaveSchema().catch((error) => {
    logger.error('Fatal error during schema fetch:', error);
    process.exit(1);
  });
}
