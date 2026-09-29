import { readdirSync, readFileSync } from 'node:fs';

import UiToolkitIntegrityVerifier from './ui-toolkit/ui-toolkit-integrity-verifier.mjs';

const verifier = new UiToolkitIntegrityVerifier({ readFile: readFileSync, readDir: readdirSync });

process.exitCode = verifier.run({ stdout: process.stdout, stderr: process.stderr });
