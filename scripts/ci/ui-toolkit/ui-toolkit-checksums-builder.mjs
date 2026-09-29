import { createHash } from 'node:crypto';

import UiToolkitInstallSource from './ui-toolkit-install-source.mjs';
import UiToolkitPinSource from './ui-toolkit-pin-source.mjs';
import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const {
  CHECKSUMS_PATH,
  ALGORITHM,
  DEFAULT_COMMENT,
  UNHASHED_FILES,
  CHECKSUM_SUFFIX,
  RELEASES_WITHOUT_CHECKSUM,
  CHECKSUM_LINE_PATTERN,
} = UI_TOOLKIT_POLICY;

export default class UiToolkitChecksumsBuilder {
  constructor({ readFile, readDir, writeFile, fetch }) {
    this.readFile = readFile;
    this.writeFile = writeFile;
    this.fetch = fetch;
    this.pinSource = new UiToolkitPinSource({ readFile });
    this.installSource = new UiToolkitInstallSource({ readFile, readDir });
  }

  async run({ stdout, stderr }) {
    const { findings, manifest } = await this.build();
    if (findings.length > 0) {
      const lines = findings.map(({ className, detail }) => `  - [${className}] ${detail}\n`);
      stderr.write(
        `ui-toolkit checksums: REFUSED (${CHECKSUMS_PATH} unchanged)\n${lines.join('')}`
      );
      return 1;
    }
    this.writeFile(CHECKSUMS_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
    stdout.write(
      `ui-toolkit checksums: wrote ${CHECKSUMS_PATH} (v${manifest.version}, ` +
        `${manifest.artifacts.length} artifacts, releaseChecksum ${manifest.releaseChecksum})\n`
    );
    return 0;
  }

  async build() {
    const pin = this.pinSource.readPackagePin();
    if ('className' in pin) {
      return { findings: [pin] };
    }
    const installFindings = this.installSource.versionFindings(pin.version);
    if (installFindings.length > 0) {
      return { findings: installFindings };
    }
    const gathered = await this.gather(pin);
    if (gathered.findings.length > 0) {
      return gathered;
    }
    return { findings: [], manifest: this.manifestFor(pin, gathered) };
  }

  async gather(pin) {
    const tarball = await this.fetchTarball(pin.spec);
    if (tarball.findings.length > 0) {
      return tarball;
    }
    const checksum = await this.settleReleaseChecksum(pin, tarball.sha256);
    if (checksum.findings.length > 0) {
      return checksum;
    }
    const tree = this.hashTree();
    if (tree.findings.length > 0) {
      return tree;
    }
    return { findings: [], tarball, checksum, tree };
  }

  manifestFor(pin, { tarball, checksum, tree }) {
    return {
      comment: this.existingComment(),
      algorithm: ALGORITHM,
      version: pin.version,
      tarballUrl: pin.spec,
      tarballSha256: tarball.sha256,
      releaseChecksum: checksum.state,
      artifacts: tree.artifacts,
    };
  }

  async request(url) {
    try {
      return { response: await this.fetch(url), findings: [] };
    } catch (error) {
      return { response: null, findings: [this.downloadFinding(url, error.message)] };
    }
  }

  downloadFinding(url, reason) {
    return { className: 'download', detail: `${url}: ${reason}` };
  }

  checksumFinding(url, reason) {
    return { className: 'checksum', detail: `${url}: ${reason}` };
  }

  async fetchTarball(url) {
    const { response, findings } = await this.request(url);
    if (findings.length > 0) {
      return { findings };
    }
    if (!response.ok) {
      return { findings: [this.downloadFinding(url, `answered HTTP ${response.status}`)] };
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return { findings: [], sha256: createHash(ALGORITHM).update(bytes).digest('hex') };
  }

  async settleReleaseChecksum({ spec, version }, tarballSha256) {
    const url = `${spec}${CHECKSUM_SUFFIX}`;
    const { response, findings } = await this.request(url);
    if (findings.length > 0) {
      return { findings };
    }
    if (response.status === 404) {
      return this.absentChecksum(url, version);
    }
    if (!response.ok) {
      return { findings: [this.downloadFinding(url, `answered HTTP ${response.status}`)] };
    }
    const assetName = spec.slice(spec.lastIndexOf('/') + 1);
    const body = await response.text();
    return {
      findings: this.checksumFindings(url, body, assetName, tarballSha256),
      state: 'matched',
    };
  }

  absentChecksum(url, version) {
    if (RELEASES_WITHOUT_CHECKSUM.includes(version)) {
      return { findings: [], state: 'absent' };
    }
    return {
      findings: [
        this.checksumFinding(
          url,
          `answered HTTP 404, but v${version} is not a release without a published checksum`
        ),
      ],
    };
  }

  checksumFindings(url, body, assetName, tarballSha256) {
    const match = CHECKSUM_LINE_PATTERN.exec(body);
    if (match === null) {
      return [this.checksumFinding(url, 'the body is not one sha256sum line')];
    }
    if (match[2] !== assetName) {
      return [this.checksumFinding(url, `names ${match[2]}, not ${assetName}`)];
    }
    if (match[1] !== tarballSha256) {
      return [
        this.checksumFinding(url, `records ${match[1]}, but the asset hashes to ${tarballSha256}`),
      ];
    }
    return [];
  }

  hashTree() {
    const { files, findings } = this.installSource.listTree();
    if (findings.length > 0) {
      return { findings: findings.map(({ detail }) => ({ className: 'install', detail })) };
    }
    const artifacts = files
      .filter((path) => !UNHASHED_FILES.includes(path))
      .sort()
      .map((path) => ({ path, sha256: this.installSource.digest(path) }));
    return { findings: [], artifacts };
  }

  existingComment() {
    try {
      return JSON.parse(this.readFile(CHECKSUMS_PATH, 'utf8')).comment ?? DEFAULT_COMMENT;
    } catch {
      return DEFAULT_COMMENT;
    }
  }
}
