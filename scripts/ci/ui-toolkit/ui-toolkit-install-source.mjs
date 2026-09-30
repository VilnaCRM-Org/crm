import { createHash } from 'node:crypto';

import UI_TOOLKIT_POLICY from './ui-toolkit-policy.mjs';

const { PACKAGE_ROOT, PACKAGE_JSON_PATH, ALGORITHM } = UI_TOOLKIT_POLICY;

export default class UiToolkitInstallSource {
  constructor({ readFile, readDir }) {
    this.readFile = readFile;
    this.readDir = readDir;
  }

  readVersion() {
    const manifestPath = `${PACKAGE_ROOT}/package.json`;
    try {
      return { version: JSON.parse(this.readFile(manifestPath, 'utf8')).version, findings: [] };
    } catch (error) {
      return {
        version: null,
        findings: [
          {
            className: 'install',
            detail:
              `${manifestPath} is unreadable (${error.message}); run make install, which runs ` +
              'bun install --frozen-lockfile in the dev container',
          },
        ],
      };
    }
  }

  versionFindings(pinnedVersion) {
    const installed = this.readVersion();
    if (installed.findings.length > 0 || installed.version === pinnedVersion) {
      return installed.findings;
    }
    return [
      {
        className: 'install',
        detail:
          `the installed toolkit is ${installed.version} but ${PACKAGE_JSON_PATH} pins ` +
          `${pinnedVersion}; run make install`,
      },
    ];
  }

  listTree() {
    const tree = { files: [], findings: [] };
    this.collect('', tree);
    return tree;
  }

  digest(relativePath) {
    return createHash(ALGORITHM)
      .update(this.readFile(`${PACKAGE_ROOT}/${relativePath}`))
      .digest('hex');
  }

  collect(relativeDir, tree) {
    const absoluteDir = relativeDir ? `${PACKAGE_ROOT}/${relativeDir}` : PACKAGE_ROOT;
    for (const entry of this.readDir(absoluteDir, { withFileTypes: true })) {
      const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        this.collect(relativePath, tree);
      } else if (entry.isFile()) {
        tree.files.push(relativePath);
      } else {
        tree.findings.push({
          className: 'extra',
          detail: `${relativePath} is not a regular file; it is reported without being read`,
        });
      }
    }
  }
}
