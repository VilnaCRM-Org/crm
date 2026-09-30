import { createHash } from 'node:crypto';

import UiToolkitInstallSource from './ui-toolkit-install-source.mjs';
import UiToolkitInstallValidator from './ui-toolkit-install-validator.mjs';
import UiToolkitPinSource from './ui-toolkit-pin-source.mjs';
import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';
import UiToolkitTarballParser from './ui-toolkit-tarball-parser.mjs';

const {
  CHECKSUMS_PATH,
  ALGORITHM,
  DEFAULT_COMMENT,
  RELEASE_API_URL,
  RELEASE_API_ACCEPT,
  RELEASE_DIGEST_PREFIX,
  RELEASE_DIGEST_PATTERN,
  ARTIFACT_PATH_PATTERN,
} = UI_TOOLKIT_POLICY;

export default class UiToolkitChecksumsBuilder {
  constructor({ readFile, readDir, writeFile, fetch, token }) {
    this.readFile = readFile;
    this.writeFile = writeFile;
    this.fetch = fetch;
    this.token = token;
    this.pinSource = new UiToolkitPinSource({ readFile });
    this.installSource = new UiToolkitInstallSource({ readFile, readDir });
    this.installValidator = new UiToolkitInstallValidator({ installSource: this.installSource });
    this.tarballParser = new UiToolkitTarballParser();
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
    const tree = this.releasedArtifacts(pin.spec, tarball.bytes);
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

  async request(url, options = {}) {
    try {
      return { response: await this.fetch(url, options), findings: [] };
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
    return { findings: [], bytes, sha256: createHash(ALGORITHM).update(bytes).digest('hex') };
  }

  async settleReleaseChecksum({ spec, version }, tarballSha256) {
    const url = `${RELEASE_API_URL}${version}`;
    const { response, findings } = await this.request(url, { headers: this.releaseHeaders() });
    if (findings.length > 0) {
      return { findings };
    }
    if (!response.ok) {
      return { findings: [this.downloadFinding(url, `answered HTTP ${response.status}`)] };
    }
    const release = await this.releaseBody(response);
    const assetName = spec.slice(spec.lastIndexOf('/') + 1);
    const problems = this.releaseProblems(release, assetName, tarballSha256);
    return {
      findings: problems.map((reason) => this.checksumFinding(url, reason)),
      state: 'matched',
    };
  }

  releaseHeaders() {
    const headers = { Accept: RELEASE_API_ACCEPT };
    return this.token ? { ...headers, Authorization: `Bearer ${this.token}` } : headers;
  }

  async releaseBody(response) {
    try {
      return Object(await response.json());
    } catch {
      return null;
    }
  }

  releaseProblems(release, assetName, tarballSha256) {
    if (release === null) {
      return ['the body is not JSON'];
    }
    if (release.immutable !== true) {
      return ['the release is not immutable, so its asset digests are not a stable anchor'];
    }
    return this.assetProblems(release.assets, assetName, tarballSha256);
  }

  assetProblems(assets, assetName, tarballSha256) {
    const listed = Array.isArray(assets) ? assets.map((asset) => Object(asset)) : [];
    const asset = listed.find(({ name }) => name === assetName);
    if (asset === undefined) {
      return [`the release lists no asset named ${assetName}`];
    }
    return this.digestProblems(asset.digest, assetName, tarballSha256);
  }

  digestProblems(digest, assetName, tarballSha256) {
    const expected = `${RELEASE_DIGEST_PREFIX}${tarballSha256}`;
    const checks = [
      [digest === undefined || digest === null, `${assetName} carries no digest`],
      [
        !RELEASE_DIGEST_PATTERN.test(digest),
        `${assetName} digest "${digest}" is not sha256: and 64 lower-case hex digits`,
      ],
      [digest !== expected, `${assetName} records ${digest}, but the asset hashes to ${expected}`],
    ];
    return checks
      .filter(([isFailed]) => isFailed)
      .map(([, reason]) => reason)
      .slice(0, 1);
  }

  releasedArtifacts(url, bytes) {
    const released = this.releasedDigests(url, bytes);
    if (released.findings.length > 0) {
      return released;
    }
    return {
      findings: this.installValidator.findings(released.digests),
      artifacts: released.digests.filter(({ path }) => ARTIFACT_PATH_PATTERN.test(path)),
    };
  }

  releasedDigests(url, bytes) {
    try {
      return { findings: [], digests: this.tarballParser.packageDigests(bytes) };
    } catch (error) {
      return {
        findings: [
          this.downloadFinding(
            url,
            `the verified body is not a gzip-compressed tar archive (${error.message})`
          ),
        ],
      };
    }
  }

  existingComment() {
    try {
      return JSON.parse(this.readFile(CHECKSUMS_PATH, 'utf8')).comment ?? DEFAULT_COMMENT;
    } catch {
      return DEFAULT_COMMENT;
    }
  }
}
