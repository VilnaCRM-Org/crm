const UI_TOOLKIT_POLICY = Object.freeze({
  PACKAGE_NAME: '@vilnacrm/ui-toolkit',
  PACKAGE_ROOT: 'node_modules/@vilnacrm/ui-toolkit',
  PACKAGE_JSON_PATH: 'package.json',
  LOCKFILE_PATH: 'bun.lock',
  CHECKSUMS_PATH: 'config/ui-toolkit-checksums.json',
  LOCKFILE_GATE_PATH: 'scripts/ci/check-lockfile-registries.sh',
  ALGORITHM: 'sha256',
  DEFAULT_COMMENT: 'SHA-256 digests of the installed toolkit files; see docs/ui-toolkit.md.',
  UNHASHED_FILES: Object.freeze(['LICENSE', 'README.md']),
  CHECKSUM_STATES: Object.freeze(['matched']),
  RELEASE_API_URL: 'https://api.github.com/repos/VilnaCRM-Org/ui-toolkit/releases/tags/v',
  RELEASE_API_ACCEPT: 'application/vnd.github+json',
  RELEASE_DIGEST_PREFIX: 'sha256:',
  RELEASE_DIGEST_PATTERN: /^sha256:[0-9a-f]{64}$/,
  RELEASE_URL_PATTERN: new RegExp(
    String.raw`^https://github\.com/VilnaCRM-Org/ui-toolkit/releases/download/` +
      String.raw`v(\d+\.\d+\.\d+)/vilnacrm-ui-toolkit-\1\.tgz$`
  ),
  ARTIFACT_PATH_PATTERN: /^(?:package\.json|build(?:\/(?!\.{1,2}(?:\/|$))[A-Za-z0-9._-]+)+)$/,
  DIGEST_PATTERN: /^[0-9a-f]{64}$/,
  WORKSPACE_LINE_PATTERN: /^\s*"@vilnacrm\/ui-toolkit": "([^"]+)",?$/m,
  PACKAGE_LINE_PATTERN: /^\s*"@vilnacrm\/ui-toolkit": \["@vilnacrm\/ui-toolkit@([^"]+)", \{/m,
  GATE_LITERAL_PATTERN: /^TOOLKIT_URL='([^']+)'$/m,
});

export default UI_TOOLKIT_POLICY;
