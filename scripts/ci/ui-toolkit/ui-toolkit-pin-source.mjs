import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const {
  PACKAGE_NAME,
  PACKAGE_JSON_PATH,
  LOCKFILE_PATH,
  CHECKSUMS_PATH,
  LOCKFILE_GATE_PATH,
  RELEASE_URL_PATTERN,
  WORKSPACE_LINE_PATTERN,
  PACKAGE_LINE_PATTERN,
  GATE_LITERAL_PATTERN,
} = UI_TOOLKIT_POLICY;

export default class UiToolkitPinSource {
  constructor({ readFile }) {
    this.readFile = readFile;
  }

  readPackagePin() {
    const spec = this.packageSpec();
    const match = RELEASE_URL_PATTERN.exec(spec);
    if (match === null) {
      return {
        className: 'pin',
        detail: `${PACKAGE_JSON_PATH} pins ${PACKAGE_NAME} to "${spec}", not a release-tarball URL`,
      };
    }
    return { spec, version: match[1] };
  }

  compareStatements() {
    const spec = this.packageSpec();
    const lockfile = this.readFile(LOCKFILE_PATH, 'utf8');
    const gate = this.readFile(LOCKFILE_GATE_PATH, 'utf8');
    const manifest = JSON.parse(this.readFile(CHECKSUMS_PATH, 'utf8'));
    const statements = [
      [`${LOCKFILE_PATH} workspace line`, this.occurrences(lockfile, WORKSPACE_LINE_PATTERN)],
      [`${LOCKFILE_PATH} packages entry`, this.occurrences(lockfile, PACKAGE_LINE_PATTERN)],
      [`${CHECKSUMS_PATH} tarballUrl`, [manifest.tarballUrl]],
      [`${LOCKFILE_GATE_PATH} TOOLKIT_URL`, this.occurrences(gate, GATE_LITERAL_PATTERN)],
    ];
    const findings = statements.flatMap(([label, values]) =>
      this.statementFindings(label, values, spec)
    );
    const version = RELEASE_URL_PATTERN.exec(spec)?.[1];
    return findings.concat(
      this.statementFindings(`${CHECKSUMS_PATH} version`, [manifest.version], version)
    );
  }

  packageSpec() {
    const manifest = JSON.parse(this.readFile(PACKAGE_JSON_PATH, 'utf8'));
    return String(manifest.dependencies?.[PACKAGE_NAME]);
  }

  occurrences(text, pattern) {
    return [...text.matchAll(new RegExp(pattern, 'gm'))].map((match) => match[1]);
  }

  statementFindings(label, values, expected) {
    if (values.length !== 1) {
      return [
        {
          className: 'drift',
          detail: `${label} occurs ${values.length} times; expected exactly once`,
        },
      ];
    }
    if (values[0] === expected) {
      return [];
    }
    return [
      {
        className: 'drift',
        detail: `${label} is "${values[0]}"; ${PACKAGE_JSON_PATH} pins "${expected}"`,
      },
    ];
  }
}
