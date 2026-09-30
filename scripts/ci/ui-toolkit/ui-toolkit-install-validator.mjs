import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const { UNHASHED_FILES } = UI_TOOLKIT_POLICY;

export default class UiToolkitInstallValidator {
  constructor({ installSource }) {
    this.installSource = installSource;
  }

  findings(released) {
    const { files, findings } = this.installSource.listTree();
    if (findings.length > 0) {
      return findings.map(({ detail }) => this.finding(detail));
    }
    const installed = files.filter((path) => !UNHASHED_FILES.includes(path)).sort();
    const expected = new Map(released.map(({ path, sha256 }) => [path, sha256]));
    return [
      ...released
        .filter(({ path }) => !installed.includes(path))
        .map(({ path }) => this.finding(`${path} is missing from the installed tree`)),
      ...installed.flatMap((path) => this.pathFindings(path, expected)),
    ];
  }

  pathFindings(path, expected) {
    if (!expected.has(path)) {
      return [this.finding(`${path} is installed but not in the release tarball`)];
    }
    if (this.installSource.digest(path) === expected.get(path)) {
      return [];
    }
    return [this.finding(`${path} differs from the verified release tarball`)];
  }

  finding(detail) {
    return { className: 'install', detail };
  }
}
