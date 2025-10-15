import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchAndSaveSchema, handleFatalError } from './lib/schemaFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR: string = __dirname;

if (process.argv[1] === __filename) {
  fetchAndSaveSchema(OUTPUT_DIR).catch((error) => handleFatalError(error, OUTPUT_DIR));
}
