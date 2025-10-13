import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { initializeServer } from './lib/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_FILE_PATH = path.join(__dirname, 'schema.graphql');

initializeServer(SCHEMA_FILE_PATH).catch((error) => {
  console.error('Fatal error during server initialization:', error);
});
