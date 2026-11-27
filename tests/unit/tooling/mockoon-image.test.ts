import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../../..');
const read = (file: string): string => fs.readFileSync(path.join(projectRoot, file), 'utf8');

const dockerfile = read('Mockoon.Dockerfile');
const entrypoint = read('scripts/docker/mockoon-entrypoint.sh');

const copies = [...dockerfile.matchAll(/^COPY (\S+) (\S+)$/gmu)].map(([, source, target]) => ({
  source: source ?? '',
  target: target ?? '',
}));

const commandLines = entrypoint
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

describe('Mockoon image and entrypoint (specs/social-sign-in, S1.1)', () => {
  it('imports the checksum-verified spec at build time, in the same layer as the check', () => {
    expect(dockerfile).toContain(
      [
        'RUN echo "${OPENAPI_SPEC_SHA256}  /app/data.yaml" | sha256sum -c - \\',
        '    && mockoon-cli import --input /app/data.yaml --output /app/base.json',
      ].join('\n')
    );
  });

  it('copies only the merge script and the entrypoint, from files that exist', () => {
    expect(copies).toEqual([
      { source: 'scripts/mockoon-social-oauth.js', target: '/app/mockoon-social-oauth.js' },
      { source: 'scripts/docker/mockoon-entrypoint.sh', target: '/app/mockoon-entrypoint.sh' },
    ]);
    copies.forEach(({ source }) =>
      expect(fs.existsSync(path.join(projectRoot, source))).toBe(true)
    );
  });

  it('starts through the entrypoint and keeps the health probe on the imported API', () => {
    expect(dockerfile.trimEnd().split('\n').at(-1)).toBe(
      'CMD ["sh", "/app/mockoon-entrypoint.sh"]'
    );
    expect(dockerfile).toContain(
      [
        'HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3',
        'CMD ["wget", "-q", "-O", "/dev/null", "http://localhost:8080/api/users"]',
      ].join(' ')
    );
  });

  it('fails closed and merges the consent page before Mockoon starts listening', () => {
    expect(entrypoint.startsWith('#!/usr/bin/env sh\n')).toBe(true);
    expect(commandLines).toEqual([
      'set -eu',
      'node /app/mockoon-social-oauth.js /app/base.json /tmp/mockoon-env.json',
      'exec mockoon-cli start --data /tmp/mockoon-env.json --port 8080',
    ]);
  });

  it('runs the merge on the paths the image provides', () => {
    const [, script, input] = commandLines[1]?.split(' ') ?? [];

    expect(copies.map(({ target }) => target)).toContain(script);
    expect(dockerfile).toContain(`--output ${input}`);
  });
});
