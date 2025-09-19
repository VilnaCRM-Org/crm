import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const run = (cmd, args) => new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`)));
    p.on('error', rej);
});
const nodeExec = process.execPath;
await run(nodeExec, [resolve(__dirname, 'out/schemaFetcher.mjs')]);
await run(nodeExec, [resolve(__dirname, 'out/server.mjs')]);