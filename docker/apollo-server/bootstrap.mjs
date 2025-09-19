import { spawn } from 'node:child_process';

const run = (cmd, args) => new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', (code) => code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`)));
    p.on('error', rej);
});

await run('node', ['./docker/apollo-server/out/schemaFetcher.mjs']);
await run('node', ['./docker/apollo-server/out/server.mjs']);