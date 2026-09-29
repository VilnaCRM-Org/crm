import UiToolkitInstallSource from './ui-toolkit-install-source.mjs';
import UiToolkitPinSource from './ui-toolkit-pin-source.mjs';
import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const {
  CHECKSUMS_PATH,
  ALGORITHM,
  UNHASHED_FILES,
  CHECKSUM_STATES,
  RELEASES_WITHOUT_CHECKSUM,
  ARTIFACT_PATH_PATTERN,
  DIGEST_PATTERN,
} = UI_TOOLKIT_POLICY;

export default class UiToolkitIntegrityVerifier {
  constructor({ readFile, readDir }) {
    this.readFile = readFile;
    this.pinSource = new UiToolkitPinSource({ readFile });
    this.installSource = new UiToolkitInstallSource({ readFile, readDir });
  }

  run({ stdout, stderr }) {
    const { findings, summary } = this.verify();
    if (findings.length > 0) {
      const lines = findings.map(({ className, detail }) => `  - [${className}] ${detail}\n`);
      stderr.write(`ui-toolkit integrity: FAIL\n${lines.join('')}`);
      return 1;
    }
    stdout.write(`ui-toolkit integrity: OK (${summary})\n`);
    return 0;
  }

  verify() {
    try {
      return this.inspect();
    } catch (error) {
      return {
        findings: [{ className: 'install', detail: `verification stopped: ${error.message}` }],
      };
    }
  }

  inspect() {
    const { manifest, findings: readFindings } = this.readManifest();
    if (readFindings.length > 0) {
      return { findings: readFindings };
    }
    const manifestFindings = this.manifestFindings(manifest);
    const pin = this.pinSource.readPackagePin();
    if ('className' in pin) {
      return { findings: [...manifestFindings, pin] };
    }
    const findings = [
      ...manifestFindings,
      ...this.pinSource.compareStatements(),
      ...this.installSource.versionFindings(pin.version),
    ];
    if (findings.length > 0) {
      return { findings };
    }
    return {
      findings: this.treeFindings(manifest.artifacts),
      summary: `v${pin.version}, ${manifest.artifacts.length} artifacts verified, 0 extra files`,
    };
  }

  readManifest() {
    try {
      return { manifest: JSON.parse(this.readFile(CHECKSUMS_PATH, 'utf8')), findings: [] };
    } catch (error) {
      return {
        findings: [{ className: 'manifest', detail: `${CHECKSUMS_PATH}: ${error.message}` }],
      };
    }
  }

  manifestFindings(manifest) {
    return [...this.headerProblems(manifest), ...this.artifactProblems(manifest.artifacts)].map(
      (detail) => ({ className: 'manifest', detail })
    );
  }

  headerProblems({ algorithm, version, tarballSha256, releaseChecksum }) {
    return this.failed([
      [algorithm !== ALGORITHM, `algorithm is "${algorithm}"; expected "${ALGORITHM}"`],
      [
        !DIGEST_PATTERN.test(tarballSha256),
        `tarballSha256 "${tarballSha256}" is not 64 lower-case hex digits`,
      ],
      [
        !CHECKSUM_STATES.includes(releaseChecksum),
        `releaseChecksum "${releaseChecksum}" is not one of ${CHECKSUM_STATES.join(', ')}`,
      ],
      [
        releaseChecksum === 'absent' && !RELEASES_WITHOUT_CHECKSUM.includes(version),
        `releaseChecksum "absent" is allowed only for ` +
          `${RELEASES_WITHOUT_CHECKSUM.join(', ')}, not ${version}`,
      ],
    ]);
  }

  artifactProblems(artifacts) {
    if (!Array.isArray(artifacts) || artifacts.length === 0) {
      return ['artifacts is not a non-empty list'];
    }
    const entries = artifacts.map((entry) => Object(entry));
    const paths = entries.map(({ path }) => path);
    return [
      ...entries.flatMap((entry) => this.entryProblems(entry)),
      ...this.duplicates(paths).map((path) => `path "${path}" is listed more than once`),
      ...this.failed([[!this.isSorted(paths), 'artifacts are not sorted by path']]),
    ];
  }

  entryProblems({ path, sha256 }) {
    return this.failed([
      [
        !ARTIFACT_PATH_PATTERN.test(path),
        `path "${path}" is not package.json or a build/ path without . or .. segments`,
      ],
      [!DIGEST_PATTERN.test(sha256), `${path} sha256 "${sha256}" is not 64 lower-case hex digits`],
    ]);
  }

  failed(checks) {
    return checks.filter(([isFailed]) => isFailed).map(([, detail]) => detail);
  }

  duplicates(paths) {
    return [...new Set(paths.filter((path, index) => paths.indexOf(path) !== index))];
  }

  isSorted(paths) {
    return paths.every((path, index) => index === 0 || paths[index - 1] <= path);
  }

  treeFindings(artifacts) {
    const { files, findings } = this.installSource.listTree();
    const installed = new Set(files);
    const listed = new Set(artifacts.map(({ path }) => path));
    const extra = files
      .filter((path) => !listed.has(path) && !UNHASHED_FILES.includes(path))
      .map((path) => ({
        className: 'extra',
        detail: `${path} is installed but neither in ${CHECKSUMS_PATH} nor unhashed`,
      }));
    return [
      ...findings,
      ...artifacts.flatMap((artifact) => this.artifactFindings(installed, artifact)),
      ...extra,
    ];
  }

  artifactFindings(installed, { path, sha256 }) {
    if (!installed.has(path)) {
      return [
        { className: 'missing', detail: `${path} is in ${CHECKSUMS_PATH} but not installed` },
      ];
    }
    const actual = this.installSource.digest(path);
    if (actual === sha256) {
      return [];
    }
    return [
      {
        className: 'digest',
        detail: `${path} hashes to ${actual}; ${CHECKSUMS_PATH} records ${sha256}`,
      },
    ];
  }
}
