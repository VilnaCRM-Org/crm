import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveSchemaSource } from './lib/schema-loader.js';
import { initializeServer } from './lib/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

initializeServer(resolveSchemaSource(__dirname)).catch((error) => {
  console.error('Fatal error during server initialization:', error);
});
