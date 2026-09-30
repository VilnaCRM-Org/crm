import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

import UiToolkitChecksumsBuilder from './ui-toolkit/ui-toolkit-checksums-builder.mjs';

const builder = new UiToolkitChecksumsBuilder({
  readFile: readFileSync,
  readDir: readdirSync,
  writeFile: writeFileSync,
  fetch: globalThis.fetch,
  token: process.env.GITHUB_TOKEN,
});

process.exitCode = await builder.run({ stdout: process.stdout, stderr: process.stderr });
