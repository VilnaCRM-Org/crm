import fs from 'fs';
import path from 'path';

const readFile = (filePath: string): string =>
  fs.readFileSync(path.resolve(__dirname, '..', '..', '..', filePath), 'utf-8');

describe('rust-code-analysis tooling expectations', () => {
  it('uses the amd64 RCA tarball and source-builds other architectures', () => {
    const dockerfile = readFile('Dockerfile');

    expect(dockerfile).toContain('ARG TARGETARCH');
    expect(dockerfile).toContain('rust-code-analysis-linux-cli-x86_64.tar.gz');
    expect(dockerfile).toMatch(
      /cargo install --locked --version "\$\{RCA_VERSION\}" rust-code-analysis-cli/
    );
  });
});
