import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { EXTRACTORS, installEnvOnlyStubs } from './extractors.mjs';

const [, , treeRoot, relativePath, extractName, outFile] = process.argv;
const extractor = EXTRACTORS[extractName];

if (!extractor) {
  process.stderr.write(`gate-ratchet: unknown extractor "${extractName}"\n`);
  process.exit(2);
}

installEnvOnlyStubs();
process.chdir(treeRoot);

const snapshot = await extractor(path.resolve(treeRoot, relativePath));
writeFileSync(outFile, JSON.stringify(snapshot));
