import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const run = (cmd, args, opts = {}) => {
      const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
      const done = new Promise((res, rej) => {
            p.on('exit', (code, signal) => {
                  if (code === 0) return res();
                  const target = args?.[args.length - 1] ?? '';
                  rej(new Error(`${cmd} ${target} exited with code ${code}${signal ? `, signal ${signal}` : ''}`));
                });
            p.on('error', rej);
          });
      return { p, done };
    };

    const nodeExec = process.execPath;
const commonArgs = process.execArgv ?? [];

    const { done: fetchDone } = run(nodeExec, [...commonArgs, resolve(__dirname, 'out/schemaFetcher.mjs')]);
await fetchDone;

    const { p: serverProc, done: serverDone } = run(nodeExec, [...commonArgs, resolve(__dirname, 'out/server.mjs')]);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGQUIT']) {
      process.on(sig, () => serverProc.kill(sig));
    }
try {
      await serverDone;
    } catch (err) {
      process.exitCode = 1;
      throw err;
    }