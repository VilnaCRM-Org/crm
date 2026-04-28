const fs = require('fs');
const path = require('path');

describe('Dockerfile rust-code-analysis stage', () => {
  it('downloads the amd64 tarball only inside the amd64 branch', () => {
    const dockerfile = fs.readFileSync(path.resolve(__dirname, '../../../Dockerfile'), 'utf8');

    expect(dockerfile).not.toMatch(
      /ADD\s+https:\/\/github\.com\/mozilla\/rust-code-analysis\/releases\/download\/v\$\{RCA_VERSION\}\/rust-code-analysis-linux-cli-x86_64\.tar\.gz\s+\/tmp\/rca\.tar\.gz/s,
    );
    expect(dockerfile).toContain('if [ "${TARGETARCH}" = "amd64" ]; then \\');
    expect(dockerfile).toContain('set -- "$@" curl; \\');
    expect(dockerfile).toMatch(
      /curl [^\n]*"https:\/\/github\.com\/mozilla\/rust-code-analysis\/releases\/download\/v\$\{RCA_VERSION\}\/rust-code-analysis-linux-cli-x86_64\.tar\.gz" -o \/tmp\/rca\.tar\.gz && \\/,
    );
    expect(dockerfile).toContain('sha256sum -c /tmp/rca.tar.gz.sha256 && \\');
    expect(dockerfile).toContain('cargo install --locked --version "${RCA_VERSION}" rust-code-analysis-cli --root /usr/local; \\');
  });
});
