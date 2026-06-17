const fs = require('fs');
const path = require('path');

const rcaTarballUrlPattern = [
  'https://github\\.com/mozilla/rust-code-analysis/releases/download/',
  'v\\$\\{RCA_VERSION\\}/rust-code-analysis-linux-cli-x86_64\\.tar\\.gz',
].join('');

const remoteAddPattern = new RegExp(
  ['ADD\\s+', rcaTarballUrlPattern, '\\s+/tmp/rca\\.tar\\.gz'].join(''),
  's'
);

const cargoInstallPattern = [
  'cargo install --locked --version "\\$\\{RCA_VERSION\\}" ',
  'rust-code-analysis-cli --root \\/usr\\/local; \\\\',
].join('');

describe('Dockerfile rust-code-analysis stage', () => {
  it('downloads the amd64 tarball only inside the amd64 branch', () => {
    const dockerfile = fs.readFileSync(path.resolve(__dirname, '../../../Dockerfile'), 'utf8');
    const rcaStage = dockerfile.slice(
      dockerfile.indexOf('# -------- rust-code-analysis Stage --------'),
      dockerfile.indexOf('ENV RCA_BIN=/usr/local/bin/rust-code-analysis-cli')
    );

    expect(dockerfile).not.toMatch(remoteAddPattern);
    expect(rcaStage).toMatch(/if \[ "\$\{TARGETARCH\}" = "amd64" \]; then \\/);
    expect(rcaStage).toMatch(/apt-get install -y --no-install-recommends curl=/);
    expect(rcaStage).toContain(
      'rca_tarball_url="https://github.com/mozilla/rust-code-analysis/releases/download/"\\'
    );
    expect(rcaStage).toMatch(
      /"v\$\{RCA_VERSION\}\/rust-code-analysis-linux-cli-x86_64\.tar\.gz"; \\/
    );
    expect(rcaStage).toContain(
      'curl --retry 5 --retry-delay 2 -fsSL "$rca_tarball_url" -o /tmp/rca.tar.gz; \\'
    );
    expect(rcaStage).toContain('sha256sum -c /tmp/rca.tar.gz.sha256; \\');
    expect(rcaStage).toMatch(new RegExp(cargoInstallPattern));
    expect(rcaStage.match(/\nRUN /g)).toHaveLength(1);
  });
});
